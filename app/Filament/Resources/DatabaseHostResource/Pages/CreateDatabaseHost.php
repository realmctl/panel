<?php

namespace Pterodactyl\Filament\Resources\DatabaseHostResource\Pages;

use Filament\Resources\Pages\CreateRecord;
use Pterodactyl\Filament\Resources\DatabaseHostResource;

class CreateDatabaseHost extends CreateRecord
{
    protected static string $resource = DatabaseHostResource::class;
}
