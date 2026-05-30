<?php

namespace Pterodactyl\Filament\Resources\NodeResource\Pages;

use Filament\Actions;
use Filament\Resources\Pages\ListRecords;
use Pterodactyl\Filament\Resources\NodeResource;

class ListNodes extends ListRecords
{
    protected static string $resource = NodeResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
