<?php

namespace Pterodactyl\Filament\Resources;

use Filament\Forms;
use Filament\Tables;
use Filament\Forms\Form;
use Filament\Tables\Table;
use Pterodactyl\Models\Node;
use Filament\Resources\Resource;
use Pterodactyl\Filament\Resources\NodeResource\Pages;

class NodeResource extends Resource
{
    protected static ?string $model = Node::class;

    protected static ?string $navigationIcon = 'heroicon-o-server-stack';

    protected static ?string $navigationGroup = 'Infrastructure';

    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Basic Information')->schema([
                Forms\Components\TextInput::make('name')
                    ->required()
                    ->maxLength(100),
                Forms\Components\Textarea::make('description')
                    ->maxLength(255),
                Forms\Components\Select::make('location_id')
                    ->relationship('location', 'short')
                    ->required()
                    ->searchable()
                    ->preload(),
                Forms\Components\Toggle::make('public')
                    ->label('Publicly visible')
                    ->default(true),
            ])->columns(2),

            Forms\Components\Section::make('Connection')->schema([
                Forms\Components\TextInput::make('fqdn')
                    ->label('FQDN')
                    ->required()
                    ->helperText('The fully qualified domain name or IP used to connect to the daemon.'),
                Forms\Components\Select::make('scheme')
                    ->options(['https' => 'HTTPS', 'http' => 'HTTP'])
                    ->required()
                    ->default('https'),
                Forms\Components\Toggle::make('behind_proxy')
                    ->label('Behind Proxy')
                    ->default(false),
                Forms\Components\Toggle::make('maintenance_mode')
                    ->label('Maintenance Mode'),
            ])->columns(2),

            Forms\Components\Section::make('Resources')->schema([
                Forms\Components\TextInput::make('memory')
                    ->label('Total Memory (MiB)')
                    ->numeric()
                    ->required()
                    ->suffix('MiB'),
                Forms\Components\TextInput::make('memory_overallocate')
                    ->label('Memory Over-Allocation (%)')
                    ->numeric()
                    ->required()
                    ->default(0)
                    ->suffix('%'),
                Forms\Components\TextInput::make('disk')
                    ->label('Total Disk (MiB)')
                    ->numeric()
                    ->required()
                    ->suffix('MiB'),
                Forms\Components\TextInput::make('disk_overallocate')
                    ->label('Disk Over-Allocation (%)')
                    ->numeric()
                    ->required()
                    ->default(0)
                    ->suffix('%'),
                Forms\Components\TextInput::make('upload_size')
                    ->label('Upload Size Limit (MiB)')
                    ->numeric()
                    ->default(100)
                    ->suffix('MiB'),
            ])->columns(2),

            Forms\Components\Section::make('Daemon Settings')->schema([
                Forms\Components\TextInput::make('daemonListen')
                    ->label('Daemon Port')
                    ->numeric()
                    ->required()
                    ->default(8080),
                Forms\Components\TextInput::make('daemonSFTP')
                    ->label('SFTP Port')
                    ->numeric()
                    ->required()
                    ->default(2022),
                Forms\Components\TextInput::make('daemonBase')
                    ->label('Data Directory')
                    ->required()
                    ->default('/var/lib/pterodactyl/volumes'),
            ])->columns(2),
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
                    ->sortable(),
                Tables\Columns\TextColumn::make('location.short')
                    ->label('Location')
                    ->sortable(),
                Tables\Columns\TextColumn::make('fqdn')
                    ->label('FQDN')
                    ->searchable(),
                Tables\Columns\TextColumn::make('memory')
                    ->label('Memory')
                    ->formatStateUsing(fn ($state) => number_format($state) . ' MiB')
                    ->sortable(),
                Tables\Columns\TextColumn::make('disk')
                    ->label('Disk')
                    ->formatStateUsing(fn ($state) => number_format($state) . ' MiB')
                    ->sortable(),
                Tables\Columns\TextColumn::make('servers_count')
                    ->label('Servers')
                    ->counts('servers')
                    ->sortable(),
                Tables\Columns\IconColumn::make('maintenance_mode')
                    ->label('Maint.')
                    ->boolean()
                    ->trueIcon('heroicon-o-wrench')
                    ->falseIcon('heroicon-o-check-circle'),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('location_id')
                    ->relationship('location', 'short')
                    ->label('Location'),
                Tables\Filters\TernaryFilter::make('maintenance_mode')
                    ->label('Maintenance'),
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

    public static function getRelations(): array
    {
        return [
            NodeResource\RelationManagers\AllocationsRelationManager::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListNodes::route('/'),
            'create' => Pages\CreateNode::route('/create'),
            'edit' => Pages\EditNode::route('/{record}/edit'),
        ];
    }

    public static function canAccess(): bool
    {
        return auth()->user()?->root_admin ?? false;
    }
}
