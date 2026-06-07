<?php

namespace Realm\Http\Controllers\Auth;

use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Realm\Facades\Activity;
use Realm\Http\Controllers\Controller;
use Realm\Models\User;
use Realm\Models\UserOAuthLink;
use Realm\Services\Users\UserCreationService;

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

        session()->pull('oauth_register', false);

        $providerId = (string) $oauthUser->getId();
        $email = $oauthUser->getEmail();

        if (!$email || $providerId === '') {
            return redirect('/auth/login');
        }

        $existingLink = UserOAuthLink::query()
            ->where('provider', $provider)
            ->where('provider_id', $providerId)
            ->first();

        if ($existingLink) {
            return $this->loginOAuthUser(User::findOrFail($existingLink->user_id), $request);
        }

        $user = User::where('email', $email)->first();

        if ($user) {
            session([
                'oauth_link_pending' => [
                    'provider' => $provider,
                    'provider_id' => $providerId,
                    'email' => $email,
                ],
            ]);

            return redirect('/auth/login')->with('error', trans('auth.oauth.link_required'));
        }

        if (!config('realm.auth.registration_enabled', false)) {
            return redirect('/auth/login');
        }

        $name = $oauthUser->getName() ?? '';
        $nameParts = explode(' ', $name, 2);
        $firstName = $nameParts[0] ?? '';
        $lastName = $nameParts[1] ?? '';
        $nickname = $oauthUser->getNickname();

        $needsUsername = empty($nickname) || User::where('username', preg_replace('/[^a-zA-Z0-9_.-]/', '_', $nickname))->exists();
        $needsName = empty($firstName);

        if (!$needsUsername && !$needsName) {
            $username = preg_replace('/[^a-zA-Z0-9_.-]/', '_', $nickname);

            $user = $this->creationService->handle([
                'email' => $email,
                'username' => $username,
                'password' => str_random(32),
                'name_first' => $firstName,
                'name_last' => $lastName ?: $firstName,
            ]);

            $this->createOAuthLink($user, $provider, $providerId);

            return $this->loginOAuthUser($user, $request);
        }

        session([
            'oauth_pending' => [
                'email' => $email,
                'name_first' => $firstName,
                'name_last' => $lastName,
                'username' => !$needsUsername ? preg_replace('/[^a-zA-Z0-9_.-]/', '_', $nickname) : '',
                'needs_username' => $needsUsername,
                'needs_name' => $needsName,
                'provider' => $provider,
                'provider_id' => $providerId,
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

        if (!empty($pending['provider']) && !empty($pending['provider_id'])) {
            $this->createOAuthLink($user, $pending['provider'], $pending['provider_id']);
        }

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

    private function loginOAuthUser(User $user, Request $request): RedirectResponse
    {
        if ($user->use_totp) {
            Activity::event('auth:checkpoint')->withRequestMetadata()->subject($user)->log();

            $token = Str::random(64);
            $request->session()->put('auth_confirmation_token', [
                'user_id' => $user->id,
                'token_value' => $token,
                'expires_at' => CarbonImmutable::now()->addMinutes(5),
            ]);

            return redirect('/auth/login/checkpoint?token=' . urlencode($token));
        }

        Auth::login($user, true);
        $request->session()->regenerate();

        return redirect('/');
    }

    private function createOAuthLink(User $user, string $provider, string $providerId): void
    {
        UserOAuthLink::firstOrCreate(
            ['provider' => $provider, 'provider_id' => $providerId],
            ['user_id' => $user->id],
        );
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
