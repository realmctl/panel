<?php

namespace Pterodactyl\Filament\Resources\NodeResource\Pages;

use Illuminate\Support\Str;
use Filament\Resources\Pages\CreateRecord;
use Pterodactyl\Filament\Resources\NodeResource;
use Pterodactyl\Models\Node;
use Illuminate\Support\Facades\Crypt;

class CreateNode extends CreateRecord
{
    protected static string $resource = NodeResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $data['uuid'] = Str::uuid()->toString();
        $data['daemon_token_id'] = Str::random(Node::DAEMON_TOKEN_ID_LENGTH);
        $data['daemon_token'] = Crypt::encrypt(Str::random(Node::DAEMON_TOKEN_LENGTH));

        return $data;
    }
}
