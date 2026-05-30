<?php

namespace Pterodactyl\Filament\Resources\UserResource\Pages;

use Illuminate\Support\Str;
use Filament\Resources\Pages\CreateRecord;
use Pterodactyl\Filament\Resources\UserResource;

class CreateUser extends CreateRecord
{
    protected static string $resource = UserResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $data['uuid'] = Str::uuid()->toString();

        return $data;
    }
}
