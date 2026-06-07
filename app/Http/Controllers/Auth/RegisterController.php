<?php

namespace Realm\Http\Controllers\Auth;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Realm\Http\Controllers\Controller;
use Realm\Services\Users\UserCreationService;

class RegisterController extends Controller
{
    public function __construct(
        private UserCreationService $creationService,
    ) {
    }

    /**
     * Handle a registration request.
     */
    public function register(Request $request): JsonResponse
    {
        if (!config('realm.auth.registration_enabled', false)) {
            return response()->json(['error' => 'Registration is disabled.'], 403);
        }

        $request->validate([
            'name_first' => 'required|string|min:1|max:191',
            'name_last' => 'required|string|min:1|max:191',
            'email' => 'required|email|unique:users,email',
            'username' => 'required|string|min:3|max:32|unique:users,username|regex:/^[a-zA-Z0-9_.-]+$/',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $this->creationService->handle([
            'email' => $request->input('email'),
            'username' => $request->input('username'),
            'password' => $request->input('password'),
            'name_first' => $request->input('name_first'),
            'name_last' => $request->input('name_last'),
        ]);

        return response()->json(['success' => true]);
    }
}
