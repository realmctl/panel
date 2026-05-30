<?php

namespace Pterodactyl\Filament\Resources\ServerResource\Pages;

use Filament\Resources\Pages\ListRecords;
use Pterodactyl\Filament\Resources\ServerResource;

class ListServers extends ListRecords
{
    protected static string $resource = ServerResource::class;
}
