<?php

namespace Realm\Tests\Integration\Api\Client\Server\Database;

use Illuminate\Http\Response;
use Mockery\MockInterface;
use Realm\Models\Database;
use Realm\Models\DatabaseHost;
use Realm\Models\Permission;
use Realm\Contracts\Extensions\HashidsInterface;
use Realm\Repositories\Eloquent\DatabaseRepository;
use Realm\Tests\Integration\Api\Client\ClientApiIntegrationTestCase;

class RotateDatabasePasswordTest extends ClientApiIntegrationTestCase
{
    private MockInterface $repository;

    public function setUp(): void
    {
        parent::setUp();

        $this->repository = $this->mock(DatabaseRepository::class);
    }

    public function testRotatingOneDatabaseDoesNotChangeOthers(): void
    {
        [$user, $server] = $this->generateTestAccount([Permission::ACTION_DATABASE_UPDATE, Permission::ACTION_DATABASE_VIEW_PASSWORD]);
        $host = DatabaseHost::factory()->create(['node_id' => $server->node_id]);

        $database = Database::factory()->create([
            'server_id' => $server->id,
            'database_host_id' => $host->id,
            'password' => encrypt('original-one'),
        ]);

        $other = Database::factory()->create([
            'server_id' => $server->id,
            'database_host_id' => $host->id,
            'password' => encrypt('original-two'),
        ]);

        $password = null;

        $this->repository->expects('dropUser')->with($database->username, $database->remote);
        $this->repository->expects('createUser')->with(
            $database->username,
            $database->remote,
            \Mockery::on(function ($value) use (&$password) {
                $password = $value;

                return true;
            }),
            $database->max_connections
        );
        $this->repository->expects('assignUserToDatabase')->with($database->database, $database->username, $database->remote);
        $this->repository->expects('flush')->withNoArgs();

        $hashids = $this->app->make(HashidsInterface::class);

        $response = $this->actingAs($user)->postJson(
            $this->link($server, '/databases/' . $hashids->encode($database->id) . '/rotate-password')
        );

        $response->assertStatus(Response::HTTP_OK);
        $response->assertJsonPath('attributes.id', $hashids->encode($database->id));
        $response->assertJsonPath('attributes.relationships.password.attributes.password', $password);

        $this->assertSame($password, decrypt($database->refresh()->password));
        $this->assertSame('original-two', decrypt($other->refresh()->password));
    }
}
