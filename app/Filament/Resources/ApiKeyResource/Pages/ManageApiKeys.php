<?php

namespace Pterodactyl\Filament\Resources\ApiKeyResource\Pages;

use Filament\Actions;
use Filament\Resources\Pages\ManageRecords;
use Pterodactyl\Filament\Resources\ApiKeyResource;
use Illuminate\Support\Str;

class ManageApiKeys extends ManageRecords
{
    protected static string $resource = ApiKeyResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make()
                ->label('Create New')
                ->modalHeading('Create Application API Credentials')
                ->mutateFormDataBeforeCreate(function (array $data): array {
                    $encrypter = app(\Illuminate\Contracts\Encryption\Encrypter::class);
                    $data['user_id'] = auth()->id();
                    $data['key_type'] = \Pterodactyl\Models\ApiKey::TYPE_APPLICATION;
                    $data['identifier'] = \Pterodactyl\Models\ApiKey::generateTokenIdentifier(\Pterodactyl\Models\ApiKey::TYPE_APPLICATION);
                    $data['token'] = $encrypter->encrypt(Str::random(\Pterodactyl\Models\ApiKey::KEY_LENGTH));

                    return $data;
                }),
        ];
    }
}
