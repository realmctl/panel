<?php

namespace Realm\Http\Controllers\Api\Application\Servers;

use Illuminate\Validation\ValidationException;
use Realm\Exceptions\Http\Connection\DaemonConnectionException;
use Realm\Exceptions\Model\DataValidationException;
use Realm\Exceptions\Repository\RecordNotFoundException;
use Realm\Models\User;
use Realm\Models\Server;
use Realm\Services\Servers\StartupModificationService;
use Realm\Transformers\Api\Application\ServerTransformer;
use Realm\Http\Controllers\Api\Application\ApplicationApiController;
use Realm\Http\Requests\Api\Application\Servers\UpdateServerStartupRequest;

class StartupController extends ApplicationApiController
{
    /**
     * StartupController constructor.
     */
    public function __construct(private StartupModificationService $modificationService)
    {
        parent::__construct();
    }

    /**
     * Update the startup and environment settings for a specific server.
     *
     * @throws ValidationException
     * @throws DaemonConnectionException
     * @throws DataValidationException
     * @throws RecordNotFoundException
     */
    public function index(UpdateServerStartupRequest $request, Server $server): array
    {
        $server = $this->modificationService
            ->setUserLevel(User::USER_LEVEL_ADMIN)
            ->handle($server, $request->validated());

        return $this->fractal->item($server)
            ->transformWith($this->getTransformer(ServerTransformer::class))
            ->toArray();
    }
}
