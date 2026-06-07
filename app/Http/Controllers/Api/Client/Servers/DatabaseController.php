<?php

namespace Realm\Http\Controllers\Api\Client\Servers;

use Throwable;
use Realm\Exceptions\Service\Database\TooManyDatabasesException;
use Realm\Exceptions\Service\Database\DatabaseClientFeatureNotEnabledException;
use Realm\Exceptions\Repository\RecordNotFoundException;
use Illuminate\Http\Response;
use Realm\Models\Server;
use Realm\Models\Database;
use Realm\Facades\Activity;
use Realm\Exceptions\DisplayException;
use Realm\Services\Databases\DatabasePasswordService;
use Realm\Transformers\Api\Client\DatabaseTransformer;
use Realm\Services\Databases\DatabaseManagementService;
use Realm\Services\Databases\DeployServerDatabaseService;
use Realm\Http\Controllers\Api\Client\ClientApiController;
use Realm\Http\Requests\Api\Client\Servers\Databases\GetDatabasesRequest;
use Realm\Http\Requests\Api\Client\Servers\Databases\StoreDatabaseRequest;
use Realm\Http\Requests\Api\Client\Servers\Databases\DeleteDatabaseRequest;
use Realm\Http\Requests\Api\Client\Servers\Databases\RotatePasswordRequest;

class DatabaseController extends ClientApiController
{
    /**
     * DatabaseController constructor.
     */
    public function __construct(
        private DeployServerDatabaseService $deployDatabaseService,
        private DatabaseManagementService $managementService,
        private DatabasePasswordService $passwordService,
    ) {
        parent::__construct();
    }

    /**
     * Return all the databases that belong to the given server.
     */
    public function index(GetDatabasesRequest $request, Server $server): array
    {
        return $this->fractal->collection($server->databases)
            ->transformWith($this->getTransformer(DatabaseTransformer::class))
            ->toArray();
    }

    /**
     * Create a new database for the given server and return it.
     *
     * @throws Throwable
     * @throws TooManyDatabasesException
     * @throws DatabaseClientFeatureNotEnabledException
     */
    public function store(StoreDatabaseRequest $request, Server $server): array
    {
        $database = Activity::event('server:database.create')->transaction(function ($log) use ($request, $server) {
            if ($server->databases()->lockForUpdate()->count() >= $server->database_limit) {
                throw new DisplayException('Cannot create additional databases on this server: limit has been reached.');
            }

            $database = $this->deployDatabaseService->handle($server, $request->validated());

            $log->subject($database)->property('name', $database->database);

            return $database;
        });

        return $this->fractal->item($database)
            ->parseIncludes(['password'])
            ->transformWith($this->getTransformer(DatabaseTransformer::class))
            ->toArray();
    }

    /**
     * Rotates the password for the given server model and returns a fresh instance to
     * the caller.
     *
     * @throws Throwable
     */
    public function rotatePassword(RotatePasswordRequest $request, Server $server, Database $database): array
    {
        Activity::event('server:database.rotate-password')
            ->subject($database)
            ->property('name', $database->database)
            ->transaction(fn () => $this->passwordService->handle($database));

        return $this->fractal->item($database->refresh())
            ->parseIncludes(['password'])
            ->transformWith($this->getTransformer(DatabaseTransformer::class))
            ->toArray();
    }

    /**
     * Removes a database from the server.
     *
     * @throws RecordNotFoundException
     */
    public function delete(DeleteDatabaseRequest $request, Server $server, Database $database): Response
    {
        $this->managementService->delete($database);

        Activity::event('server:database.delete')
            ->subject($database)
            ->property('name', $database->database)
            ->log();

        return new Response('', Response::HTTP_NO_CONTENT);
    }
}
