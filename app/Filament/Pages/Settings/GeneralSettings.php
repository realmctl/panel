<?php

namespace Pterodactyl\Filament\Pages\Settings;

use Filament\Forms;
use Filament\Forms\Form;
use Filament\Pages\Page;
use Filament\Actions\Action;
use Filament\Notifications\Notification;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;

class GeneralSettings extends Page implements Forms\Contracts\HasForms
{
    use Forms\Concerns\InteractsWithForms;

    protected static ?string $navigationIcon = 'heroicon-o-cog-6-tooth';

    protected static ?string $navigationGroup = 'Configuration';

    protected static ?string $navigationLabel = 'General';

    protected static ?int $navigationSort = 1;

    protected static string $view = 'filament.pages.settings';

    public ?array $data = [];

    public function mount(): void
    {
        $this->form->fill([
            'app_name' => config('app.name'),
            'app_locale' => config('app.locale'),
            'pterodactyl_guzzle_timeout' => config('pterodactyl.guzzle.timeout'),
            'pterodactyl_guzzle_connect_timeout' => config('pterodactyl.guzzle.connect_timeout'),
        ]);
    }

    public function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Panel Settings')->schema([
                Forms\Components\TextInput::make('app_name')
                    ->label('Panel Name')
                    ->required(),
                Forms\Components\Select::make('app_locale')
                    ->label('Language')
                    ->options([
                        'en' => 'English',
                        'nl' => 'Dutch',
                        'de' => 'German',
                        'fr' => 'French',
                        'es' => 'Spanish',
                    ])
                    ->required(),
            ])->columns(2),

            Forms\Components\Section::make('HTTP Connections')->schema([
                Forms\Components\TextInput::make('pterodactyl_guzzle_timeout')
                    ->label('Request Timeout (seconds)')
                    ->numeric()
                    ->required(),
                Forms\Components\TextInput::make('pterodactyl_guzzle_connect_timeout')
                    ->label('Connect Timeout (seconds)')
                    ->numeric()
                    ->required(),
            ])->columns(2),
        ])->statePath('data');
    }

    public function save(): void
    {
        $data = $this->form->getState();
        $settings = app(SettingsRepositoryInterface::class);

        $settings->set('settings::app:name', $data['app_name']);
        $settings->set('settings::app:locale', $data['app_locale']);
        $settings->set('settings::pterodactyl:guzzle:timeout', $data['pterodactyl_guzzle_timeout']);
        $settings->set('settings::pterodactyl:guzzle:connect_timeout', $data['pterodactyl_guzzle_connect_timeout']);

        Notification::make()->title('Settings saved.')->success()->send();
    }

    protected function getHeaderActions(): array
    {
        return [
            Action::make('save')
                ->label('Save')
                ->action('save'),
        ];
    }

    public static function canAccess(): bool
    {
        return auth()->user()?->root_admin ?? false;
    }
}
