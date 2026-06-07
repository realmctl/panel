<?php

namespace Realm\Http\Controllers\Api\Client\Servers;

use Illuminate\Http\JsonResponse;
use Realm\Models\Allocation;
use Realm\Models\Server;
use Realm\Services\Minecraft\MinecraftServerStatusService;
use Realm\Http\Controllers\Api\Client\ClientApiController;
use Realm\Http\Requests\Api\Client\Servers\GetPlayersRequest;

class PlayerController extends ClientApiController
{
    public function __construct(private MinecraftServerStatusService $statusService)
    {
        parent::__construct();
    }

    /**
     * Return live Minecraft player status for a server via mcsrvstat.us.
     */
    public function index(GetPlayersRequest $request, Server $server): JsonResponse
    {
        $allocation = null;

        if ($request->filled('allocation')) {
            $allocation = Allocation::query()
                ->where('server_id', $server->id)
                ->where('id', $request->integer('allocation'))
                ->firstOrFail();
        }

        return new JsonResponse([
            'object' => 'minecraft_server_status',
            'attributes' => $this->statusService->getStatus($server, $allocation),
        ]);
    }
}
