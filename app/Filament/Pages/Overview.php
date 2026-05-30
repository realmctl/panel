<?php

namespace Pterodactyl\Filament\Pages;

use Filament\Pages\Page;
use Pterodactyl\Models\Node;
use Pterodactyl\Models\User;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Allocation;
use Pterodactyl\Services\Helpers\SoftwareVersionService;

class Overview extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-home';

    protected static ?string $navigationLabel = 'Overview';

    protected static ?string $title = 'Overview';

    protected static ?int $navigationSort = -2;

    protected string $view = 'filament.pages.overview';

    public function getViewData(): array
    {
        $versionService = app(SoftwareVersionService::class);
        $nodes = Node::count();
        $activeNodes = Node::where('maintenance_mode', false)->count();
        $allocations = Allocation::count();
        $usedAllocations = Allocation::whereNotNull('server_id')->count();
        $suspendedServers = Server::where('status', 'suspended')->count();

        return [
            'version' => config('app.version'),
            'laravelVersion' => app()->version(),
            'phpVersion' => PHP_VERSION,
            'filamentVersion' => \Composer\InstalledVersions::getPrettyVersion('filament/filament') ?? 'unknown',
            'isLatest' => $versionService->isLatestPanel(),
            'latestVersion' => $versionService->getPanel(),
            'servers' => Server::count(),
            'users' => User::count(),
            'nodes' => $nodes,
            'activeNodes' => $activeNodes,
            'allocations' => $allocations,
            'usedAllocations' => $usedAllocations,
            'suspendedServers' => $suspendedServers,
            'totalMemory' => Node::sum('memory'),
            'totalDisk' => Node::sum('disk'),
        ];
    }

    public static function canAccess(): bool
    {
        return auth()->user()?->root_admin ?? false;
    }
}
