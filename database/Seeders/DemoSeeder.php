<?php

namespace Database\Seeders;

use Illuminate\Support\Arr;
use Illuminate\Database\Seeder;
use Ramsey\Uuid\Uuid;
use Realm\Models\Egg;
use Realm\Models\Node;
use Realm\Models\User;
use Realm\Models\Allocation;
use Illuminate\Contracts\Hashing\Hasher;
use Realm\Services\Servers\ServerCreationService;
use Realm\Exceptions\DisplayException;

class DemoSeeder extends Seeder
{
    public function __construct(
        private Hasher $hasher,
        private ServerCreationService $serverCreationService,
    ) {
    }

    /**
     * Recreate the shared demo admin account and a single demo server. Expects
     * the users, servers, and related tables to already have been wiped by the
     * caller (see DemoResetCommand) — nodes, locations, nests, and eggs are
     * left untouched since they're treated as static infrastructure.
     *
     * @throws \Throwable
     */
    public function run(): void
    {
        $admin = $this->createAdmin();
        $this->createDemoServer($admin);
    }

    private function createAdmin(): User
    {
        $config = config('realm.demo_mode.admin');

        return User::query()->create([
            'uuid' => Uuid::uuid4()->toString(),
            'email' => $config['email'],
            'username' => $config['username'],
            'name_first' => $config['name_first'],
            'name_last' => $config['name_last'],
            'password' => $this->hasher->make($config['password'] ?: Uuid::uuid4()->toString()),
            'root_admin' => true,
            'use_totp' => false,
            'email_verified_at' => now(),
        ]);
    }

    /**
     * @throws \Throwable
     * @throws DisplayException
     */
    private function createDemoServer(User $admin): void
    {
        $config = config('realm.demo_mode.server');

        $egg = Egg::query()->where('name', $config['egg_name'])->firstOrFail();

        $node = Node::query()->firstOrFail();

        /** @var Allocation $allocation */
        $allocation = Allocation::query()
            ->where('node_id', $node->id)
            ->whereNull('server_id')
            ->firstOrFail();

        $this->serverCreationService->handle([
            'name' => $config['name'],
            'description' => 'Resets automatically every hour. Have fun!',
            'owner_id' => $admin->id,
            'node_id' => $node->id,
            'allocation_id' => $allocation->id,
            'nest_id' => $egg->nest_id,
            'egg_id' => $egg->id,
            'memory' => $config['memory'],
            'swap' => $config['swap'],
            'disk' => $config['disk'],
            'io' => $config['io'],
            'cpu' => $config['cpu'],
            'startup' => $egg->startup,
            'image' => Arr::first($egg->docker_images),
            'environment' => $egg->variables->pluck('default_value', 'env_variable')->toArray(),
            'start_on_completion' => true,
        ]);
    }
}
