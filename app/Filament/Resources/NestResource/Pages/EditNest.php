<?php

namespace Pterodactyl\Filament\Resources\NestResource\Pages;

use Filament\Actions;
use Filament\Resources\Pages\EditRecord;
use Pterodactyl\Filament\Resources\NestResource;

class EditNest extends EditRecord
{
    protected static string $resource = NestResource::class;

    protected function getHeaderActions(): array
    {
        return [Actions\DeleteAction::make()];
    }
}
