<?php

namespace Pterodactyl\Filament\Resources;

use Filament\Forms;
use Filament\Tables;
use Filament\Forms\Form;
use Filament\Tables\Table;
use Pterodactyl\Models\ApiKey;
use Filament\Resources\Resource;
use Pterodactyl\Services\Acl\Api\AdminAcl;
use Pterodactyl\Filament\Resources\ApiKeyResource\Pages;
use Illuminate\Database\Eloquent\Builder;

class ApiKeyResource extends Resource
{
    protected static ?string $model = ApiKey::class;

    protected static ?string $navigationIcon = 'heroicon-o-key';

    protected static ?string $navigationLabel = 'Application API';

    protected static ?string $title = 'Application API';

    protected static ?int $navigationSort = 98;

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->where('key_type', ApiKey::TYPE_APPLICATION);
    }

    public static function form(Form $form): Form
    {
        $resources = AdminAcl::getResourceList();
        sort($resources);

        $permissionFields = [];
        foreach ($resources as $resource) {
            $permissionFields[] = Forms\Components\Select::make('r_' . $resource)
                ->label(str_replace('_', ' ', title_case($resource)))
                ->options([
                    AdminAcl::NONE => 'None',
                    AdminAcl::READ => 'Read',
                    AdminAcl::READ | AdminAcl::WRITE => 'Read & Write',
                ])
                ->default(AdminAcl::NONE)
                ->required();
        }

        return $form->schema([
            Forms\Components\Section::make('Description')
                ->schema([
                    Forms\Components\TextInput::make('memo')
                        ->label('Description')
                        ->required()
                        ->maxLength(500),
                ]),
            Forms\Components\Section::make('Permissions')
                ->description('Select the permissions for this Application API key.')
                ->schema($permissionFields)
                ->columns(3),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('token')
                    ->label('API Key')
                    ->fontFamily('mono')
                    ->copyable()
                    ->getStateUsing(function (ApiKey $record) {
                        if (auth()->user()?->is($record->user)) {
                            try {
                                return $record->identifier . decrypt($record->token);
                            } catch (\Exception $e) {
                                return $record->identifier . ' [Decrypt Error]';
                            }
                        }
                        return $record->identifier . '********************************';
                    }),
                Tables\Columns\TextColumn::make('memo')
                    ->label('Memo')
                    ->searchable(),
                Tables\Columns\TextColumn::make('user.username')
                    ->label('Created By')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('last_used_at')
                    ->label('Last Used')
                    ->dateTime()
                    ->sortable()
                    ->placeholder('—'),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Created')
                    ->dateTime()
                    ->sortable(),
            ])
            ->actions([
                Tables\Actions\DeleteAction::make()
                    ->label('Revoke')
                    ->modalHeading('Revoke API Key')
                    ->modalDescription('Once this API key is revoked, any applications currently using it will stop working.'),
            ])
            ->bulkActions([
                Tables\Actions\DeleteBulkAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ManageApiKeys::route('/'),
        ];
    }

    public static function canAccess(): bool
    {
        return auth()->user()?->root_admin ?? false;
    }
}
