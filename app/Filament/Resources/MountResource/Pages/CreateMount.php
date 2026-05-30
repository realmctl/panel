<?php

namespace Pterodactyl\Filament\Resources\MountResource\Pages;

use Illuminate\Support\Str;
use Filament\Resources\Pages\CreateRecord;
use Pterodactyl\Filament\Resources\MountResource;

class CreateMount extends CreateRecord
{
    protected static string $resource = MountResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $data['uuid'] = Str::uuid()->toString();

        return $data;
    }
}
