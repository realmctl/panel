<?php

namespace Pterodactyl\Filament\Resources\ServerResource\Pages;

use Filament\Actions;
use Filament\Resources\Pages\EditRecord;
use Pterodactyl\Filament\Resources\ServerResource;

class EditServer extends EditRecord
{
    protected static string $resource = ServerResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
