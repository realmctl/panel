<?php

namespace Pterodactyl\Filament\Resources\MountResource\Pages;

use Filament\Actions;
use Filament\Resources\Pages\ListRecords;
use Pterodactyl\Filament\Resources\MountResource;

class ManageMounts extends ListRecords
{
    protected static string $resource = MountResource::class;

    protected function getHeaderActions(): array
    {
        return [Actions\CreateAction::make()];
    }
}
