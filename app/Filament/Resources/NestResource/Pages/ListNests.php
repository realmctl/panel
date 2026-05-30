<?php

namespace Pterodactyl\Filament\Resources\NestResource\Pages;

use Filament\Actions;
use Filament\Resources\Pages\ListRecords;
use Pterodactyl\Filament\Resources\NestResource;

class ListNests extends ListRecords
{
    protected static string $resource = NestResource::class;

    protected function getHeaderActions(): array
    {
        return [Actions\CreateAction::make()];
    }
}
