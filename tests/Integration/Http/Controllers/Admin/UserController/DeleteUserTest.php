<?php

namespace Realm\Tests\Integration\Http\Controllers\Admin\UserController;

use Realm\Models\User;
use Realm\Tests\Integration\Http\HttpTestCase;

class DeleteUserTest extends HttpTestCase
{
    public function testNonAdminCannotAccessEndpoint(): void
    {
        $user = User::factory()->create();

        $this->actingAs(User::factory()->create())
            ->deleteJson("/api/admin/users/{$user->id}")
            ->assertForbidden();
    }

    public function testCannotDeleteSelf(): void
    {
        $this->actingAs($user = User::factory()->admin()->create())
            ->deleteJson("/api/admin/users/{$user->id}")
            ->assertBadRequest()
            ->assertJsonPath('errors.0.detail', __('admin/user.exceptions.delete_self'));

        $this->assertModelExists($user);
    }

    public function testUserIsDeleted(): void
    {
        $user = User::factory()->create();

        $this->actingAs(User::factory()->admin()->create())
            ->deleteJson("/api/admin/users/{$user->id}")
            ->assertNoContent();

        $this->assertModelMissing($user);
    }
}
