<?php

namespace Pterodactyl\Http\Controllers\Admin\Nodes;

use Illuminate\Http\Request;
use Pterodactyl\Models\Node;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Repositories\Wings\DaemonConfigurationRepository;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;

class NodeHealthController extends Controller
{
    public function __construct(private DaemonConfigurationRepository $repository)
    {
    }

    public function __invoke(Request $request, Node $node): JsonResponse
    {
        try {
            $data = $this->repository->setNode($node)->getSystemInformation();

            return new JsonResponse([
                'version' => $data['version'] ?? '',
            ]);
        } catch (DaemonConnectionException) {
            return new JsonResponse([
                'error' => 'Offline — could not connect',
            ], 503);
        }
    }
}
