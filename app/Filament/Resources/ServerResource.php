<?php

namespace Pterodactyl\Filament\Resources;

use Filament\Forms;
use Filament\Tables;
use Filament\Forms\Form;
use Filament\Tables\Table;
use Pterodactyl\Models\Server;
use Filament\Resources\Resource;
use Pterodactyl\Filament\Resources\ServerResource\Pages;

class ServerResource extends Resource
{
    protected static ?string $model = Server::class;

    protected static ?string $navigationIcon = 'heroicon-o-cube';

    protected static ?string $navigationGroup = 'Server Management';

    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Server Details')->schema([
                Forms\Components\TextInput::make('name')
                    ->required()
                    ->maxLength(191),
                Forms\Components\Select::make('owner_id')
                    ->label('Owner')
                    ->relationship('user', 'username')
                    ->searchable()
                    ->preload()
                    ->required(),
                Forms\Components\Textarea::make('description')
                    ->maxLength(191),
                Forms\Components\TextInput::make('external_id')
                    ->label('External ID')
                    ->maxLength(191),
            ])->columns(2),

            Forms\Components\Section::make('Resource Limits')->schema([
                Forms\Components\TextInput::make('memory')
                    ->label('Memory (MiB)')
                    ->numeric()
                    ->required()
                    ->suffix('MiB'),
                Forms\Components\TextInput::make('swap')
                    ->label('Swap (MiB)')
                    ->numeric()
                    ->required()
                    ->suffix('MiB'),
                Forms\Components\TextInput::make('disk')
                    ->label('Disk (MiB)')
                    ->numeric()
                    ->required()
                    ->suffix('MiB'),
                Forms\Components\TextInput::make('cpu')
                    ->label('CPU Limit (%)')
                    ->numeric()
                    ->required()
                    ->suffix('%'),
                Forms\Components\TextInput::make('io')
                    ->label('Block IO Weight')
                    ->numeric()
                    ->required()
                    ->default(500),
                Forms\Components\TextInput::make('threads')
                    ->label('CPU Pinning')
                    ->helperText('e.g. 0-3 or 0,1,2'),
            ])->columns(3),

            Forms\Components\Section::make('Allocation')->schema([
                Forms\Components\Select::make('node_id')
                    ->label('Node')
                    ->relationship('node', 'name')
                    ->searchable()
                    ->preload()
                    ->required()
                    ->reactive(),
                Forms\Components\Select::make('allocation_id')
                    ->label('Primary Allocation')
                    ->relationship('allocation', 'port')
                    ->searchable()
                    ->required(),
            ])->columns(2),

            Forms\Components\Section::make('Limits')->schema([
                Forms\Components\TextInput::make('database_limit')
                    ->label('Database Limit')
                    ->numeric()
                    ->default(0),
                Forms\Components\TextInput::make('allocation_limit')
                    ->label('Allocation Limit')
                    ->numeric()
                    ->default(0),
                Forms\Components\TextInput::make('backup_limit')
                    ->label('Backup Limit')
                    ->numeric()
                    ->required()
                    ->default(0),
            ])->columns(3),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')
                    ->label('ID')
                    ->sortable(),
                Tables\Columns\TextColumn::make('name')
                    ->searchable()
                    ->sortable()
                    ->limit(30),
                Tables\Columns\TextColumn::make('user.username')
                    ->label('Owner')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('node.name')
                    ->label('Node')
                    ->sortable(),
                Tables\Columns\TextColumn::make('memory')
                    ->label('Memory')
                    ->formatStateUsing(fn ($state) => $state . ' MiB')
                    ->sortable(),
                Tables\Columns\TextColumn::make('disk')
                    ->label('Disk')
                    ->formatStateUsing(fn ($state) => $state . ' MiB')
                    ->sortable(),
                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn ($state) => match ($state) {
                        null => 'success',
                        'suspended' => 'danger',
                        'installing' => 'warning',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn ($state) => $state ?? 'Active'),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('node_id')
                    ->relationship('node', 'name')
                    ->label('Node'),
                Tables\Filters\SelectFilter::make('owner_id')
                    ->relationship('user', 'username')
                    ->label('Owner')
                    ->searchable(),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListServers::route('/'),
            'edit' => Pages\EditServer::route('/{record}/edit'),
        ];
    }

    public static function canAccess(): bool
    {
        return auth()->user()?->root_admin ?? false;
    }
}
