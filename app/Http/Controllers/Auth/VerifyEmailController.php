<?php

namespace Realm\Http\Controllers\Auth;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Realm\Facades\Activity;
use Realm\Models\User;
use Realm\Http\Controllers\Controller;

class VerifyEmailController extends Controller
{
    /**
     * Confirm a user's email address using a signed verification link.
     */
    public function verify(int $id, string $hash): JsonResponse
    {
        $user = User::query()->find($id);

        if (!$user || !hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            return response()->json(['error' => 'This verification link is invalid.'], 403);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'success' => true,
                'message' => 'Your email address is already verified. You can log in.',
            ]);
        }

        $user->markEmailAsVerified();

        Activity::event('auth:verify-email')
            ->withRequestMetadata()
            ->subject($user)
            ->log();

        return response()->json([
            'success' => true,
            'message' => 'Your email address has been verified. You can now log in.',
        ]);
    }

    /**
     * Resend the verification email for an unverified account. Always returns a
     * generic response so this endpoint cannot be used to enumerate accounts.
     */
    public function resend(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $user = User::query()->where('email', $request->input('email'))->first();

        if ($user && !$user->hasVerifiedEmail()) {
            $user->sendEmailVerificationNotification();
        }

        return response()->json([
            'success' => true,
            'message' => 'If an account exists with that email address and is not yet verified, a new verification link has been sent.',
        ]);
    }
}
