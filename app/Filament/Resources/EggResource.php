<?php

namespace Pterodactyl\Filament\Resources;

use Filament\Forms;
use Filament\Tables;
use Filament\Forms\Form;
use Filament\Tables\Table;
use Pterodactyl\Models\Egg;
use Filament\Resources\Resource;
use Pterodactyl\Filament\Resources\EggResource\Pages;

class EggResource extends Resource
{
    protected static $model = Egg::class;

    protected static $navigationIcon = 'heroicon-o-puzzle-piece';

    protected static $navigationSort = 3;

    public static function getNavigationGroup(): ?string
    {
        return 'Server Management';
    }

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Tabs::make('Egg')->tabs([
                Forms\Components\Tabs\Tab::make('Configuration')->schema([
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
                Forms\Components\Tabs\Tab::make('Process Management')->schema([
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
                Forms\Components\Tabs\Tab::make('Install Script')->schema([
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
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
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
