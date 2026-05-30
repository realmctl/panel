<?php

namespace Pterodactyl\Filament\Widgets;

use Pterodactyl\Models\Node;
use Pterodactyl\Models\User;
use Pterodactyl\Models\Server;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class StatsOverview extends StatsOverviewWidget
{
    protected function getStats(): array
    {
        return [
            Stat::make('Servers', Server::count())
                ->icon('heroicon-o-cube')
                ->color('primary'),
            Stat::make('Users', User::count())
                ->icon('heroicon-o-users')
                ->color('success'),
            Stat::make('Nodes', Node::count())
                ->icon('heroicon-o-server-stack')
                ->color('warning'),
            Stat::make('Allocations', \Pterodactyl\Models\Allocation::count())
                ->icon('heroicon-o-signal')
                ->color('info'),
        ];
    }
}
