<?php

namespace Pterodactyl\Filament\Resources\EggResource\Pages;

use Illuminate\Support\Str;
use Filament\Resources\Pages\CreateRecord;
use Pterodactyl\Filament\Resources\EggResource;

class CreateEgg extends CreateRecord
{
    protected static string $resource = EggResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $data['uuid'] = Str::uuid()->toString();

        return $data;
    }
}
