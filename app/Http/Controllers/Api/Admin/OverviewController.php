<?php

namespace Realm\Http\Controllers\Api\Admin;

use Illuminate\Http\JsonResponse;
use Realm\Http\Controllers\Controller;
use Realm\Models\DatabaseHost;
use Realm\Models\Location;
use Realm\Models\Mount;
use Realm\Models\Nest;
use Realm\Models\Node;
use Realm\Models\Server;
use Realm\Models\Subdomain\Domain;
use Realm\Models\User;

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
