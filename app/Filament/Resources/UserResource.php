<?php

namespace Pterodactyl\Filament\Resources;

use Filament\Forms;
use Filament\Tables;
use Filament\Forms\Form;
use Filament\Tables\Table;
use Pterodactyl\Models\User;
use Filament\Resources\Resource;
use Illuminate\Support\Facades\Hash;
use Pterodactyl\Filament\Resources\UserResource\Pages;

class UserResource extends Resource
{
    protected static $model = User::class;

    protected static $navigationIcon = 'heroicon-o-users';

    protected static $navigationSort = 1;

    public static function getNavigationGroup(): ?string
    {
        return 'User Management';
    }

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Account Information')->schema([
                Forms\Components\TextInput::make('username')
                    ->required()
                    ->unique(ignoreRecord: true)
                    ->maxLength(191),
                Forms\Components\TextInput::make('email')
                    ->email()
                    ->required()
                    ->unique(ignoreRecord: true)
                    ->maxLength(191),
                Forms\Components\TextInput::make('name_first')
                    ->label('First Name')
                    ->required()
                    ->maxLength(191),
                Forms\Components\TextInput::make('name_last')
                    ->label('Last Name')
                    ->required()
                    ->maxLength(191),
                Forms\Components\TextInput::make('external_id')
                    ->label('External ID')
                    ->maxLength(191),
            ])->columns(2),

            Forms\Components\Section::make('Password')->schema([
                Forms\Components\TextInput::make('password')
                    ->password()
                    ->dehydrateStateUsing(fn ($state) => !empty($state) ? Hash::make($state) : null)
                    ->dehydrated(fn ($state) => filled($state))
                    ->required(fn (string $operation) => $operation === 'create')
                    ->minLength(8)
                    ->label(fn (string $operation) => $operation === 'create' ? 'Password' : 'New Password (leave blank to keep current)'),
            ]),

            Forms\Components\Section::make('Permissions')->schema([
                Forms\Components\Toggle::make('root_admin')
                    ->label('Administrator')
                    ->helperText('Grants full administrative access to the panel.'),
                Forms\Components\Select::make('language')
                    ->options([
                        'en' => 'English',
                        'nl' => 'Dutch',
                        'de' => 'German',
                        'fr' => 'French',
                        'es' => 'Spanish',
                        'pt' => 'Portuguese',
                    ])
                    ->default('en'),
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
                Tables\Columns\TextColumn::make('username')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('email')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('name_first')
                    ->label('Name')
                    ->formatStateUsing(fn ($record) => $record->name)
                    ->searchable(),
                Tables\Columns\IconColumn::make('root_admin')
                    ->label('Admin')
                    ->boolean(),
                Tables\Columns\IconColumn::make('use_totp')
                    ->label('2FA')
                    ->boolean(),
                Tables\Columns\TextColumn::make('servers_count')
                    ->label('Servers')
                    ->counts('servers')
                    ->sortable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\TernaryFilter::make('root_admin')
                    ->label('Administrator'),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListUsers::route('/'),
            'create' => Pages\CreateUser::route('/create'),
            'edit' => Pages\EditUser::route('/{record}/edit'),
        ];
    }

    public static function canAccess(): bool
    {
        return auth()->user()?->root_admin ?? false;
    }
}
