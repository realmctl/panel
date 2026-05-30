<?php

namespace Pterodactyl\Filament\Resources\LocationResource\Pages;

use Filament\Actions;
use Filament\Resources\Pages\ManageRecords;
use Pterodactyl\Filament\Resources\LocationResource;

class ManageLocations extends ManageRecords
{
    protected static string $resource = LocationResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
