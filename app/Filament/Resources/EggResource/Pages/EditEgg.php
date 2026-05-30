<?php

namespace Pterodactyl\Filament\Resources\EggResource\Pages;

use Filament\Actions;
use Filament\Resources\Pages\EditRecord;
use Pterodactyl\Filament\Resources\EggResource;

class EditEgg extends EditRecord
{
    protected static string $resource = EggResource::class;

    protected function getHeaderActions(): array
    {
        return [Actions\DeleteAction::make()];
    }
}
