<?php

namespace Pterodactyl\Filament\Pages;

use Filament\Pages\Page;
use Pterodactyl\Models\Node;
use Pterodactyl\Services\Helpers\SoftwareVersionService;

class Dashboard extends Page
{
    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-home';

    protected static ?string $navigationLabel = 'Overview';

    protected static ?string $title = 'Overview';

    protected static ?int $navigationSort = -2;

    protected string $view = 'filament.pages.overview';

    public function getHeaderWidgets(): array
    {
        return [
            \Pterodactyl\Filament\Widgets\StatsOverview::class,
        ];
    }

    public function getHeaderWidgetsColumns(): int|array
    {
        return 4;
    }

    public function getViewData(): array
    {
        $versionService = app(SoftwareVersionService::class);

        return [
            'version' => config('app.version'),
            'laravelVersion' => app()->version(),
            'phpVersion' => PHP_VERSION,
            'filamentVersion' => \Composer\InstalledVersions::getPrettyVersion('filament/filament') ?? 'unknown',
            'isLatest' => $versionService->isLatestPanel(),
            'latestVersion' => $versionService->getPanel(),
            'totalMemory' => Node::sum('memory'),
            'totalDisk' => Node::sum('disk'),
        ];
    }

    public static function canAccess(): bool
    {
        return auth()->user()?->root_admin ?? false;
    }
}
