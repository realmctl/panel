<?php

namespace Pterodactyl\Filament\Resources\NodeResource\Pages;

use Filament\Actions;
use Filament\Resources\Pages\EditRecord;
use Pterodactyl\Filament\Resources\NodeResource;

class EditNode extends EditRecord
{
    protected static string $resource = NodeResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
