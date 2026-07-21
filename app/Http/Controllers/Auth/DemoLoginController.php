<?php

namespace Realm\Http\Controllers\Auth;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Realm\Models\User;

class DemoLoginController extends AbstractLoginController
{
    /**
     * Sign the visitor in as the shared demo admin account, no password required.
     * Only reachable when demo mode is enabled.
     */
    public function login(Request $request): JsonResponse
    {
        abort_unless(config('realm.demo_mode.enabled'), 404);

        $user = User::query()
            ->where('email', config('realm.demo_mode.admin.email'))
            ->firstOrFail();

        return $this->sendLoginResponse($user, $request);
    }
}
