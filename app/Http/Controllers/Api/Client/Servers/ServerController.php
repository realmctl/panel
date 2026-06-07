<?php

namespace Realm\Http\Controllers\Api\Client\Servers;

use Realm\Models\Server;
use Realm\Transformers\Api\Client\ServerTransformer;
use Realm\Services\Servers\GetUserPermissionsService;
use Realm\Http\Controllers\Api\Client\ClientApiController;
use Realm\Http\Requests\Api\Client\Servers\GetServerRequest;

class ServerController extends ClientApiController
{
    /**
     * ServerController constructor.
     */
    public function __construct(private GetUserPermissionsService $permissionsService)
    {
        parent::__construct();
    }

    /**
     * Transform an individual server into a response that can be consumed by a
     * client using the API.
     */
    public function index(GetServerRequest $request, Server $server): array
    {
        return $this->fractal->item($server)
            ->transformWith($this->getTransformer(ServerTransformer::class))
            ->addMeta([
                'is_server_owner' => $request->user()->id === $server->owner_id,
                'user_permissions' => $this->permissionsService->handle($server, $request->user()),
            ])
            ->toArray();
    }
}
