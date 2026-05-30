<?php

namespace Pterodactyl\Filament\Resources\NestResource\Pages;

use Illuminate\Support\Str;
use Filament\Resources\Pages\CreateRecord;
use Pterodactyl\Filament\Resources\NestResource;

class CreateNest extends CreateRecord
{
    protected static string $resource = NestResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $data['uuid'] = Str::uuid()->toString();

        return $data;
    }
}
