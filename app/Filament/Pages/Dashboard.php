<?php

namespace Pterodactyl\Filament\Pages;

use Filament\Pages\Page;
use Pterodactyl\Models\Node;
use Pterodactyl\Models\User;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Allocation;
use Pterodactyl\Services\Helpers\SoftwareVersionService;

class Dashboard extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-home';

    protected static ?string $navigationLabel = 'Overview';

    protected static ?string $title = 'Overview';

    protected static ?int $navigationSort = -2;

    protected static string $view = 'filament.pages.overview';

    public function getViewData(): array
    {
        $versionService = app(SoftwareVersionService::class);

        return [
            'version' => config('app.version'),
            'laravelVersion' => app()->version(),
            'phpVersion' => PHP_VERSION,
            'isLatest' => $versionService->isLatestPanel(),
            'latestVersion' => $versionService->getPanel(),
            'servers' => Server::count(),
            'users' => User::count(),
            'nodes' => Node::count(),
            'allocations' => Allocation::count(),
            'suspendedServers' => Server::where('status', 'suspended')->count(),
            'activeNodes' => Node::where('maintenance_mode', false)->count(),
            'totalMemory' => Node::sum('memory'),
            'totalDisk' => Node::sum('disk'),
        ];
    }

    public static function canAccess(): bool
    {
        return auth()->user()?->root_admin ?? false;
    }
}
