<?php

namespace Pterodactyl\Filament\Resources;

use UnitEnum;
use BackedEnum;
use Filament\Forms;
use Filament\Tables;
use Filament\Actions;
use Filament\Tables\Table;
use Filament\Schemas\Schema;
use Pterodactyl\Models\Egg;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Tabs;
use Filament\Schemas\Components\Tabs\Tab;
use Pterodactyl\Filament\Resources\EggResource\Pages;

class EggResource extends Resource
{
    protected static ?string $model = Egg::class;

    protected static string|BackedEnum|null $navigationIcon = 'heroicon-o-puzzle-piece';

    protected static string|UnitEnum|null $navigationGroup = 'Server Management';

    protected static ?int $navigationSort = 3;

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Tabs::make('Egg')->tabs([
                Tab::make('Configuration')->schema([
                    Forms\Components\Select::make('nest_id')
                        ->relationship('nest', 'name')
                        ->required()
                        ->searchable()
                        ->preload(),
                    Forms\Components\TextInput::make('name')
                        ->required()
                        ->maxLength(191),
                    Forms\Components\Textarea::make('description'),
                    Forms\Components\TextInput::make('author')
                        ->email()
                        ->required()
                        ->disabled(fn (string $operation) => $operation === 'edit'),
                    Forms\Components\TagsInput::make('docker_images')
                        ->required()
                        ->helperText('Docker images available for this egg.'),
                    Forms\Components\Textarea::make('startup')
                        ->label('Startup Command')
                        ->required(),
                    Forms\Components\Toggle::make('force_outgoing_ip')
                        ->label('Force Outgoing IP'),
                ]),
                Tab::make('Process Management')->schema([
                    Forms\Components\Textarea::make('config_files')
                        ->label('Configuration Files')
                        ->helperText('JSON encoded configuration file definitions.'),
                    Forms\Components\Textarea::make('config_startup')
                        ->label('Startup Configuration')
                        ->helperText('JSON encoded startup configuration.'),
                    Forms\Components\Textarea::make('config_logs')
                        ->label('Log Configuration'),
                    Forms\Components\TextInput::make('config_stop')
                        ->label('Stop Command')
                        ->maxLength(191),
                ]),
                Tab::make('Install Script')->schema([
                    Forms\Components\TextInput::make('script_container')
                        ->label('Script Container')
                        ->default('ghcr.io/pterodactyl/installers:alpine'),
                    Forms\Components\TextInput::make('script_entry')
                        ->label('Script Entry')
                        ->default('bash'),
                    Forms\Components\Toggle::make('script_is_privileged')
                        ->label('Run as Privileged')
                        ->default(true),
                    Forms\Components\Textarea::make('script_install')
                        ->label('Install Script')
                        ->rows(15),
                ]),
            ])->columnSpanFull(),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')->label('ID')->sortable(),
                Tables\Columns\TextColumn::make('name')->searchable()->sortable(),
                Tables\Columns\TextColumn::make('nest.name')->label('Nest')->sortable(),
                Tables\Columns\TextColumn::make('author')->searchable(),
                Tables\Columns\TextColumn::make('servers_count')->label('Servers')->counts('servers')->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('nest_id')
                    ->relationship('nest', 'name')
                    ->label('Nest'),
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
            'index' => Pages\ListEggs::route('/'),
            'create' => Pages\CreateEgg::route('/create'),
            'edit' => Pages\EditEgg::route('/{record}/edit'),
        ];
    }

    public static function canAccess(): bool
    {
        return auth()->user()?->root_admin ?? false;
    }
}
