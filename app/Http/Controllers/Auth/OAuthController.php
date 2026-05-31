<?php

namespace Pterodactyl\Http\Controllers\Auth;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Models\User;
use Pterodactyl\Services\Users\UserCreationService;

class OAuthController extends Controller
{
    private const SUPPORTED_PROVIDERS = ['google', 'discord', 'github'];

    public function __construct(
        private UserCreationService $creationService,
    ) {
    }

    /**
     * Redirect the user to the OAuth provider.
     */
    public function redirect(Request $request, string $provider): RedirectResponse
    {
        if (!$this->isProviderEnabled($provider)) {
            return redirect('/auth/login');
        }

        if ($request->has('register')) {
            session(['oauth_register' => true]);
        }

        return Socialite::driver($provider)
            ->redirectUrl(url("/auth/oauth/{$provider}/callback"))
            ->redirect();
    }

    /**
     * Handle the callback from the OAuth provider.
     */
    public function callback(Request $request, string $provider): RedirectResponse
    {
        if (!$this->isProviderEnabled($provider)) {
            return redirect('/auth/login');
        }

        try {
            $oauthUser = Socialite::driver($provider)
                ->redirectUrl(url("/auth/oauth/{$provider}/callback"))
                ->user();
        } catch (\Exception $e) {
            return redirect('/auth/login');
        }

        $isRegister = session()->pull('oauth_register', false);

        // Try to find existing user by email
        $user = User::where('email', $oauthUser->getEmail())->first();

        if ($user) {
            Auth::login($user, true);

            return redirect('/');
        }

        // No existing user — check if registration is enabled
        if (!config('pterodactyl.auth.registration_enabled', false)) {
            return redirect('/auth/login');
        }

        // Extract user info from provider
        $name = $oauthUser->getName() ?? '';
        $nameParts = explode(' ', $name, 2);
        $firstName = $nameParts[0] ?? '';
        $lastName = $nameParts[1] ?? '';
        $nickname = $oauthUser->getNickname();
        $email = $oauthUser->getEmail();

        if (!$email) {
            return redirect('/auth/login');
        }

        // Determine what's missing
        $needsUsername = empty($nickname) || User::where('username', preg_replace('/[^a-zA-Z0-9_.-]/', '_', $nickname))->exists();
        $needsName = empty($firstName);

        // If nothing is missing, create account directly
        if (!$needsUsername && !$needsName) {
            $username = preg_replace('/[^a-zA-Z0-9_.-]/', '_', $nickname);

            $user = $this->creationService->handle([
                'email' => $email,
                'username' => $username,
                'password' => str_random(32),
                'name_first' => $firstName,
                'name_last' => $lastName ?: $firstName,
            ]);

            Auth::login($user, true);

            return redirect('/');
        }

        // Store what we have and what's missing
        session([
            'oauth_pending' => [
                'email' => $email,
                'name_first' => $firstName,
                'name_last' => $lastName,
                'username' => !$needsUsername ? preg_replace('/[^a-zA-Z0-9_.-]/', '_', $nickname) : '',
                'needs_username' => $needsUsername,
                'needs_name' => $needsName,
                'provider' => $provider,
            ],
        ]);

        return redirect('/auth/oauth/complete');
    }

    /**
     * Handle the OAuth completion form submission.
     */
    public function completeRegistration(Request $request): JsonResponse
    {
        $pending = session('oauth_pending');
        if (!$pending) {
            return response()->json(['error' => 'No pending OAuth registration.'], 403);
        }

        $rules = [];
        if ($pending['needs_username'] ?? true) {
            $rules['username'] = 'required|string|min:3|max:32|unique:users,username|regex:/^[a-zA-Z0-9_.-]+$/';
        }
        if ($pending['needs_name'] ?? false) {
            $rules['name_first'] = 'required|string|min:1|max:191';
            $rules['name_last'] = 'required|string|min:1|max:191';
        }

        $request->validate($rules);

        $user = $this->creationService->handle([
            'email' => $pending['email'],
            'username' => $request->input('username', $pending['username'] ?? ''),
            'password' => str_random(32),
            'name_first' => $request->input('name_first', $pending['name_first']) ?: 'User',
            'name_last' => $request->input('name_last', $pending['name_last']) ?: 'User',
        ]);

        session()->forget('oauth_pending');
        Auth::login($user, true);

        return response()->json(['success' => true]);
    }

    /**
     * Return what fields are needed for completion.
     */
    public function completionStatus(Request $request): JsonResponse
    {
        $pending = session('oauth_pending');
        if (!$pending) {
            return response()->json(['error' => 'No pending OAuth registration.'], 403);
        }

        return response()->json([
            'needs_username' => $pending['needs_username'] ?? true,
            'needs_name' => $pending['needs_name'] ?? false,
            'email' => $pending['email'] ?? '',
            'provider' => $pending['provider'] ?? '',
        ]);
    }

    /**
     * Check if a provider is enabled and valid.
     */
    private function isProviderEnabled(string $provider): bool
    {
        if (!in_array($provider, self::SUPPORTED_PROVIDERS)) {
            return false;
        }

        return (bool) config("oauth.{$provider}.enabled", false);
    }
}
