<?php

namespace Pterodactyl\Filament\Widgets;

use Pterodactyl\Models\Node;
use Pterodactyl\Models\User;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Allocation;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class StatsOverview extends StatsOverviewWidget
{
    protected ?string $pollingInterval = '30s';

    protected function getStats(): array
    {
        $servers = Server::count();
        $users = User::count();
        $nodes = Node::count();
        $activeNodes = Node::where('maintenance_mode', false)->count();
        $allocations = Allocation::count();
        $usedAllocations = Allocation::whereNotNull('server_id')->count();
        $suspendedServers = Server::where('status', 'suspended')->count();

        return [
            Stat::make('Servers', number_format($servers))
                ->description($suspendedServers > 0 ? $suspendedServers . ' suspended' : 'All active')
                ->descriptionIcon($suspendedServers > 0 ? 'heroicon-m-exclamation-triangle' : 'heroicon-m-check-circle')
                ->color($suspendedServers > 0 ? 'warning' : 'success'),

            Stat::make('Users', number_format($users))
                ->description('Registered accounts')
                ->descriptionIcon('heroicon-m-user-group')
                ->color('primary'),

            Stat::make('Nodes', $activeNodes . ' / ' . $nodes)
                ->description($activeNodes === $nodes ? 'All online' : ($nodes - $activeNodes) . ' in maintenance')
                ->descriptionIcon($activeNodes === $nodes ? 'heroicon-m-check-circle' : 'heroicon-m-wrench-screwdriver')
                ->color($activeNodes === $nodes ? 'success' : 'warning'),

            Stat::make('Allocations', number_format($allocations))
                ->description($usedAllocations . ' assigned, ' . ($allocations - $usedAllocations) . ' free')
                ->descriptionIcon('heroicon-m-signal')
                ->color('info'),
        ];
    }
}
