<?php

namespace Pterodactyl\Filament\Pages;

use Filament\Pages\Dashboard as BaseDashboard;
use Pterodactyl\Models\Node;
use Pterodactyl\Models\User;
use Pterodactyl\Models\Server;
use Filament\Widgets\StatsOverviewWidget\Stat;

class Dashboard extends BaseDashboard
{
    protected static ?string $navigationIcon = 'heroicon-o-home';

    public function getHeaderWidgets(): array
    {
        return [
            \Pterodactyl\Filament\Widgets\StatsOverview::class,
        ];
    }
}
