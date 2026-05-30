<?php

namespace Pterodactyl\Filament\Resources\EggResource\Pages;

use Filament\Actions;
use Filament\Resources\Pages\ListRecords;
use Pterodactyl\Filament\Resources\EggResource;

class ListEggs extends ListRecords
{
    protected static string $resource = EggResource::class;

    protected function getHeaderActions(): array
    {
        return [Actions\CreateAction::make()];
    }
}
