<?php

namespace Pterodactyl\Filament\Resources;

use Filament\Forms;
use Filament\Tables;
use Filament\Forms\Form;
use Filament\Tables\Table;
use Pterodactyl\Models\Location;
use Filament\Resources\Resource;
use Pterodactyl\Filament\Resources\LocationResource\Pages;

class LocationResource extends Resource
{
    protected static $model = Location::class;

    protected static $navigationIcon = 'heroicon-o-map-pin';

    protected static $navigationSort = 2;

    public static function getNavigationGroup(): ?string
    {
        return 'Infrastructure';
    }

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\TextInput::make('short')
                ->label('Short Code')
                ->required()
                ->unique(ignoreRecord: true)
                ->maxLength(60),
            Forms\Components\TextInput::make('long')
                ->label('Description')
                ->maxLength(191),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')->label('ID')->sortable(),
                Tables\Columns\TextColumn::make('short')->label('Short Code')->searchable()->sortable(),
                Tables\Columns\TextColumn::make('long')->label('Description')->searchable(),
                Tables\Columns\TextColumn::make('nodes_count')->label('Nodes')->counts('nodes')->sortable(),
                Tables\Columns\TextColumn::make('servers_count')->label('Servers')->counts('servers')->sortable(),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\DeleteBulkAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ManageLocations::route('/'),
        ];
    }

    public static function canAccess(): bool
    {
        return auth()->user()?->root_admin ?? false;
    }
}
