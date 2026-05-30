<?php

namespace Pterodactyl\Filament\Resources\MountResource\Pages;

use Filament\Actions;
use Filament\Resources\Pages\EditRecord;
use Pterodactyl\Filament\Resources\MountResource;

class EditMount extends EditRecord
{
    protected static string $resource = MountResource::class;

    protected function getHeaderActions(): array
    {
        return [Actions\DeleteAction::make()];
    }
}
