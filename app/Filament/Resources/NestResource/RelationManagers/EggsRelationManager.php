<?php

namespace Pterodactyl\Filament\Resources\NestResource\RelationManagers;

use Filament\Forms;
use Filament\Tables;
use Filament\Actions;
use Filament\Tables\Table;
use Filament\Schemas\Schema;
use Filament\Resources\RelationManagers\RelationManager;

class EggsRelationManager extends RelationManager
{
    protected static string $relationship = 'eggs';

    public function form(Schema $schema): Schema
    {
        return $schema->components([
            Forms\Components\TextInput::make('name')->required()->maxLength(191),
            Forms\Components\Textarea::make('description'),
            Forms\Components\TextInput::make('author')->email()->required(),
        ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')->searchable()->sortable(),
                Tables\Columns\TextColumn::make('author'),
                Tables\Columns\TextColumn::make('servers_count')->label('Servers')->counts('servers'),
            ])
            ->recordActions([
                Actions\EditAction::make(),
            ]);
    }
}
