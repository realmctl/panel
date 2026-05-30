<?php

namespace Pterodactyl\Filament\Resources\DatabaseHostResource\Pages;

use Filament\Actions;
use Filament\Resources\Pages\EditRecord;
use Pterodactyl\Filament\Resources\DatabaseHostResource;

class EditDatabaseHost extends EditRecord
{
    protected static string $resource = DatabaseHostResource::class;

    protected function getHeaderActions(): array
    {
        return [Actions\DeleteAction::make()];
    }
}
