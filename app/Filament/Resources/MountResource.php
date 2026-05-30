<?php

namespace Pterodactyl\Filament\Resources;

use Filament\Forms;
use Filament\Tables;
use Filament\Forms\Form;
use Filament\Tables\Table;
use Pterodactyl\Models\Mount;
use Filament\Resources\Resource;
use Pterodactyl\Filament\Resources\MountResource\Pages;

class MountResource extends Resource
{
    protected static ?string $model = Mount::class;

    protected static ?string $navigationIcon = 'heroicon-o-folder-open';

    protected static ?string $navigationGroup = 'Infrastructure';

    protected static ?int $navigationSort = 3;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Mount Configuration')->schema([
                Forms\Components\TextInput::make('name')
                    ->required()
                    ->unique(ignoreRecord: true)
                    ->maxLength(64),
                Forms\Components\Textarea::make('description')
                    ->maxLength(191),
                Forms\Components\TextInput::make('source')
                    ->required()
                    ->helperText('File path on the host system to mount.'),
                Forms\Components\TextInput::make('target')
                    ->required()
                    ->helperText('File path inside the container to mount to.'),
                Forms\Components\Toggle::make('read_only')
                    ->label('Read Only')
                    ->default(false),
                Forms\Components\Toggle::make('user_mountable')
                    ->label('User Mountable')
                    ->helperText('Allow users to self-mount this to their servers.')
                    ->default(false),
            ])->columns(2),

            Forms\Components\Section::make('Assignments')->schema([
                Forms\Components\Select::make('eggs')
                    ->relationship('eggs', 'name')
                    ->multiple()
                    ->preload()
                    ->searchable(),
                Forms\Components\Select::make('nodes')
                    ->relationship('nodes', 'name')
                    ->multiple()
                    ->preload()
                    ->searchable(),
            ])->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')->label('ID')->sortable(),
                Tables\Columns\TextColumn::make('name')->searchable()->sortable(),
                Tables\Columns\TextColumn::make('source')->limit(40),
                Tables\Columns\TextColumn::make('target')->limit(40),
                Tables\Columns\IconColumn::make('read_only')->boolean(),
                Tables\Columns\IconColumn::make('user_mountable')->boolean(),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ManageMounts::route('/'),
            'create' => Pages\CreateMount::route('/create'),
            'edit' => Pages\EditMount::route('/{record}/edit'),
        ];
    }

    public static function canAccess(): bool
    {
        return auth()->user()?->root_admin ?? false;
    }
}
