<?php

namespace Pterodactyl\Filament\Resources;

use UnitEnum;
use BackedEnum;
use Filament\Forms;
use Filament\Tables;
use Filament\Actions;
use Filament\Tables\Table;
use Filament\Schemas\Schema;
use Pterodactyl\Models\DatabaseHost;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Pterodactyl\Filament\Resources\DatabaseHostResource\Pages;

class DatabaseHostResource extends Resource
{
    protected static ?string $model = DatabaseHost::class;

    protected static string|BackedEnum|null $navigationIcon = 'heroicon-o-circle-stack';

    protected static string|UnitEnum|null $navigationGroup = 'Infrastructure';

    protected static ?string $navigationLabel = 'Database Hosts';

    protected static ?int $navigationSort = 4;

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Host Details')->schema([
                Forms\Components\TextInput::make('name')
                    ->required()
                    ->maxLength(191),
                Forms\Components\TextInput::make('host')
                    ->required()
                    ->helperText('The IP or FQDN of the database host.'),
                Forms\Components\TextInput::make('port')
                    ->numeric()
                    ->required()
                    ->default(3306),
                Forms\Components\TextInput::make('username')
                    ->required()
                    ->maxLength(32),
                Forms\Components\TextInput::make('password')
                    ->password()
                    ->dehydrated(fn ($state) => filled($state))
                    ->required(fn (string $operation) => $operation === 'create'),
                Forms\Components\TextInput::make('max_databases')
                    ->label('Max Databases')
                    ->numeric()
                    ->helperText('Leave blank for unlimited.'),
                Forms\Components\Select::make('node_id')
                    ->label('Linked Node')
                    ->relationship('node', 'name')
                    ->searchable()
                    ->preload()
                    ->helperText('Optionally link to a specific node.'),
            ])->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')->label('ID')->sortable(),
                Tables\Columns\TextColumn::make('name')->searchable()->sortable(),
                Tables\Columns\TextColumn::make('host')->searchable(),
                Tables\Columns\TextColumn::make('port'),
                Tables\Columns\TextColumn::make('username'),
                Tables\Columns\TextColumn::make('max_databases')->label('Max DBs'),
                Tables\Columns\TextColumn::make('node.name')->label('Node'),
                Tables\Columns\TextColumn::make('databases_count')->label('Databases')->counts('databases'),
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

    public static function getPages(): array
    {
        return [
            'index' => Pages\ManageDatabaseHosts::route('/'),
            'create' => Pages\CreateDatabaseHost::route('/create'),
            'edit' => Pages\EditDatabaseHost::route('/{record}/edit'),
        ];
    }

    public static function canAccess(): bool
    {
        return auth()->user()?->root_admin ?? false;
    }
}
