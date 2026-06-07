<?php

namespace Realm\Http\Controllers\Api\Application\Servers;

use Throwable;
use Realm\Exceptions\DisplayException;
use Realm\Exceptions\Model\DataValidationException;
use Realm\Exceptions\Repository\RecordNotFoundException;
use Illuminate\Http\Response;
use Realm\Models\Server;
use Realm\Services\Servers\SuspensionService;
use Realm\Services\Servers\ReinstallServerService;
use Realm\Http\Requests\Api\Application\Servers\ServerWriteRequest;
use Realm\Http\Controllers\Api\Application\ApplicationApiController;

class ServerManagementController extends ApplicationApiController
{
    /**
     * ServerManagementController constructor.
     */
    public function __construct(
        private ReinstallServerService $reinstallServerService,
        private SuspensionService $suspensionService,
    ) {
        parent::__construct();
    }

    /**
     * Suspend a server on the Panel.
     *
     * @throws Throwable
     */
    public function suspend(ServerWriteRequest $request, Server $server): Response
    {
        $this->suspensionService->toggle($server);

        return $this->returnNoContent();
    }

    /**
     * Unsuspend a server on the Panel.
     *
     * @throws Throwable
     */
    public function unsuspend(ServerWriteRequest $request, Server $server): Response
    {
        $this->suspensionService->toggle($server, SuspensionService::ACTION_UNSUSPEND);

        return $this->returnNoContent();
    }

    /**
     * Mark a server as needing to be reinstalled.
     *
     * @throws DisplayException
     * @throws DataValidationException
     * @throws RecordNotFoundException
     */
    public function reinstall(ServerWriteRequest $request, Server $server): Response
    {
        $this->reinstallServerService->handle($server);

        return $this->returnNoContent();
    }
}
