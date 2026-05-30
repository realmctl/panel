<?php

namespace Pterodactyl\Filament\Resources\DatabaseHostResource\Pages;

use Filament\Actions;
use Filament\Resources\Pages\ListRecords;
use Pterodactyl\Filament\Resources\DatabaseHostResource;

class ManageDatabaseHosts extends ListRecords
{
    protected static string $resource = DatabaseHostResource::class;

    protected function getHeaderActions(): array
    {
        return [Actions\CreateAction::make()];
    }
}
