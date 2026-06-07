<?php

namespace Pterodactyl\Http\Controllers\Api\Admin;

use Illuminate\Http\JsonResponse;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Models\DatabaseHost;
use Pterodactyl\Models\Location;
use Pterodactyl\Models\Mount;
use Pterodactyl\Models\Nest;
use Pterodactyl\Models\Node;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Subdomain\Domain;
use Pterodactyl\Models\User;

class OverviewController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'stats' => [
                'servers' => Server::query()->count(),
                'users' => User::query()->count(),
                'nodes' => Node::query()->count(),
                'locations' => Location::query()->count(),
                'nests' => Nest::query()->count(),
                'mounts' => Mount::query()->count(),
                'database_hosts' => DatabaseHost::query()->count(),
                'subdomain_domains' => Domain::query()->count(),
            ],
        ]);
    }
}
