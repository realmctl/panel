<?php

namespace Pterodactyl\Filament\Resources\NodeResource\RelationManagers;

use Filament\Forms;
use Filament\Tables;
use Filament\Actions;
use Filament\Tables\Table;
use Filament\Schemas\Schema;
use Filament\Resources\RelationManagers\RelationManager;

class AllocationsRelationManager extends RelationManager
{
    protected static string $relationship = 'allocations';

    public function form(Schema $schema): Schema
    {
        return $schema->components([
            Forms\Components\TextInput::make('ip')
                ->label('IP Address')
                ->required(),
            Forms\Components\TextInput::make('port')
                ->numeric()
                ->required()
                ->minValue(1024)
                ->maxValue(65535),
            Forms\Components\TextInput::make('ip_alias')
                ->label('Alias'),
            Forms\Components\TextInput::make('notes')
                ->maxLength(256),
        ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('ip')->searchable(),
                Tables\Columns\TextColumn::make('port')->sortable(),
                Tables\Columns\TextColumn::make('ip_alias')->label('Alias'),
                Tables\Columns\TextColumn::make('server.name')->label('Assigned To'),
            ])
            ->filters([
                Tables\Filters\TernaryFilter::make('assigned')
                    ->queries(
                        true: fn ($query) => $query->whereNotNull('server_id'),
                        false: fn ($query) => $query->whereNull('server_id'),
                    ),
            ])
            ->headerActions([
                Actions\CreateAction::make(),
            ])
            ->recordActions([
                Actions\EditAction::make(),
                Actions\DeleteAction::make(),
            ])
            ->toolbarActions([
                Actions\BulkActionGroup::make([
                    Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }
}
