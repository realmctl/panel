<?php

namespace Pterodactyl\Http\Controllers\Auth;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Models\User;

class OAuthController extends Controller
{
    private const SUPPORTED_PROVIDERS = ['google', 'discord', 'github'];

    /**
     * Redirect the user to the OAuth provider.
     */
    public function redirect(Request $request, string $provider): RedirectResponse
    {
        if (!$this->isProviderEnabled($provider)) {
            return redirect('/auth/login');
        }

        // Store whether this is a registration attempt
        if ($request->has('register')) {
            session(['oauth_register' => true]);
        }

        return Socialite::driver($provider)->redirect();
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
            $oauthUser = Socialite::driver($provider)->user();
        } catch (\Exception $e) {
            return redirect('/auth/login');
        }

        $isRegister = session()->pull('oauth_register', false);

        // Try to find existing user by email
        $user = User::where('email', $oauthUser->getEmail())->first();

        if ($user) {
            // Existing user — log them in
            Auth::login($user, true);
            return redirect('/');
        }

        // No existing user — check if registration is enabled
        if (!$isRegister || !config('pterodactyl.auth.registration_enabled', false)) {
            return redirect('/auth/login');
        }

        // Try to create account with available data
        $name = $oauthUser->getName() ?? '';
        $nameParts = explode(' ', $name, 2);
        $firstName = $nameParts[0] ?? '';
        $lastName = $nameParts[1] ?? '';
        $nickname = $oauthUser->getNickname();

        // If we have enough info, create the account directly
        if ($firstName && $oauthUser->getEmail()) {
            // If no username from provider, redirect to completion page
            if (!$nickname) {
                session([
                    'oauth_pending' => [
                        'email' => $oauthUser->getEmail(),
                        'name_first' => $firstName,
                        'name_last' => $lastName,
                        'provider' => $provider,
                    ],
                ]);
                return redirect('/auth/oauth/complete');
            }

            // Ensure username is unique
            $username = Str::slug($nickname, '_');
            if (User::where('username', $username)->exists()) {
                $username = $username . '_' . Str::random(4);
            }

            $user = User::create([
                'uuid' => Str::uuid()->toString(),
                'email' => $oauthUser->getEmail(),
                'username' => $username,
                'password' => Hash::make(Str::random(32)),
                'name_first' => $firstName,
                'name_last' => $lastName ?: $firstName,
            ]);

            Auth::login($user, true);
            return redirect('/');
        }

        // Not enough info — redirect to completion
        session([
            'oauth_pending' => [
                'email' => $oauthUser->getEmail() ?? '',
                'name_first' => $firstName,
                'name_last' => $lastName,
                'provider' => $provider,
            ],
        ]);
        return redirect('/auth/oauth/complete');
    }

    /**
     * Show the OAuth completion form (React handles this).
     */
    public function completeForm(Request $request)
    {
        if (!session()->has('oauth_pending')) {
            return redirect('/auth/login');
        }

        // Pass pending data to the React app via the standard view
        return view('templates.auth.core');
    }

    /**
     * Handle the OAuth completion form submission.
     */
    public function completeRegistration(Request $request): \Illuminate\Http\JsonResponse
    {
        $pending = session('oauth_pending');
        if (!$pending) {
            return response()->json(['error' => 'No pending OAuth registration.'], 403);
        }

        $request->validate([
            'username' => 'required|string|min:3|max:32|unique:users,username|regex:/^[a-zA-Z0-9_.-]+$/',
            'name_first' => 'required_if:needs_name,true|string|max:191',
            'name_last' => 'required_if:needs_name,true|string|max:191',
        ]);

        $user = User::create([
            'uuid' => Str::uuid()->toString(),
            'email' => $pending['email'],
            'username' => $request->input('username'),
            'password' => Hash::make(Str::random(32)),
            'name_first' => $request->input('name_first', $pending['name_first']) ?: 'User',
            'name_last' => $request->input('name_last', $pending['name_last']) ?: 'User',
        ]);

        session()->forget('oauth_pending');
        Auth::login($user, true);

        return response()->json(['success' => true]);
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
