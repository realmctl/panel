<?php

namespace Pterodactyl\Filament\Pages;

use Filament\Forms;
use Filament\Forms\Form;
use Filament\Pages\Page;
use Filament\Actions\Action;
use Filament\Notifications\Notification;
use Pterodactyl\Notifications\MailTested;
use Illuminate\Support\Facades\Notification as NotificationFacade;
use Illuminate\Contracts\Encryption\Encrypter;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;

class Settings extends Page implements Forms\Contracts\HasForms
{
    use Forms\Concerns\InteractsWithForms;

    protected static ?string $navigationIcon = 'heroicon-o-cog-6-tooth';

    protected static ?string $navigationLabel = 'Settings';

    protected static ?string $title = 'Settings';

    protected static ?int $navigationSort = 99;

    protected static string $view = 'filament.pages.settings-tabs';

    public ?array $generalData = [];
    public ?array $mailData = [];
    public ?array $securityData = [];
    public string $activeTab = 'general';

    public function mount(): void
    {
        $this->generalForm->fill([
            'app_name' => config('app.name'),
            'app_locale' => config('app.locale'),
            'pterodactyl_guzzle_timeout' => config('pterodactyl.guzzle.timeout'),
            'pterodactyl_guzzle_connect_timeout' => config('pterodactyl.guzzle.connect_timeout'),
        ]);

        $this->mailForm->fill([
            'driver' => config('mail.default'),
            'smtp_host' => config('mail.mailers.smtp.host'),
            'smtp_port' => config('mail.mailers.smtp.port'),
            'smtp_encryption' => config('mail.mailers.smtp.encryption'),
            'smtp_username' => config('mail.mailers.smtp.username'),
            'from_address' => config('mail.from.address'),
            'from_name' => config('mail.from.name'),
        ]);

        $this->securityForm->fill([
            'captcha_provider' => config('captcha.provider', 'recaptcha'),
            'recaptcha_secret_key' => config('captcha.recaptcha.secret_key'),
            'recaptcha_website_key' => config('captcha.recaptcha.website_key'),
            'turnstile_secret_key' => config('captcha.turnstile.secret_key'),
            'turnstile_website_key' => config('captcha.turnstile.website_key'),
            'require_2fa' => config('pterodactyl.auth.2fa_required'),
        ]);
    }

    protected function getForms(): array
    {
        return [
            'generalForm',
            'mailForm',
            'securityForm',
        ];
    }

    public function generalForm(Form $form): Form
    {
        return $form->schema([
            Forms\Components\TextInput::make('app_name')->label('Panel Name')->required(),
            Forms\Components\Select::make('app_locale')->label('Language')
                ->options(['en' => 'English', 'nl' => 'Dutch', 'de' => 'German', 'fr' => 'French', 'es' => 'Spanish'])
                ->required(),
            Forms\Components\TextInput::make('pterodactyl_guzzle_timeout')->label('Request Timeout (s)')->numeric()->required(),
            Forms\Components\TextInput::make('pterodactyl_guzzle_connect_timeout')->label('Connect Timeout (s)')->numeric()->required(),
        ])->columns(2)->statePath('generalData');
    }

    public function mailForm(Form $form): Form
    {
        $driver = config('mail.default');
        $fields = [
            Forms\Components\Placeholder::make('driver_info')
                ->label('Active Driver')
                ->content(strtoupper($driver) . ' — change via .env or artisan command'),
        ];

        if ($driver === 'smtp') {
            $fields = array_merge($fields, [
                Forms\Components\TextInput::make('smtp_host')->label('SMTP Host')->required(),
                Forms\Components\TextInput::make('smtp_port')->label('SMTP Port')->numeric()->required(),
                Forms\Components\Select::make('smtp_encryption')->label('Encryption')
                    ->options(['' => 'None', 'tls' => 'TLS', 'ssl' => 'SSL']),
                Forms\Components\TextInput::make('smtp_username')->label('Username'),
                Forms\Components\TextInput::make('smtp_password')->label('Password')->password()
                    ->helperText('Leave blank to keep current.'),
            ]);
        } elseif ($driver === 'resend') {
            $fields[] = Forms\Components\TextInput::make('resend_key')->label('Resend API Key')->password()
                ->helperText('Leave blank to keep current.');
        }

        $fields[] = Forms\Components\TextInput::make('from_address')->label('From Address')->email()->required();
        $fields[] = Forms\Components\TextInput::make('from_name')->label('From Name');

        return $form->schema($fields)->columns(2)->statePath('mailData');
    }

    public function securityForm(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Select::make('captcha_provider')->label('CAPTCHA Provider')
                ->options(['none' => 'Disabled', 'recaptcha' => 'reCAPTCHA', 'turnstile' => 'Cloudflare Turnstile'])
                ->reactive(),
            Forms\Components\Select::make('require_2fa')->label('Require 2FA')
                ->options([0 => 'Not Required', 1 => 'Admin Only', 2 => 'All Users']),
            Forms\Components\TextInput::make('recaptcha_website_key')->label('reCAPTCHA Site Key')
                ->visible(fn (Forms\Get $get) => $get('captcha_provider') === 'recaptcha'),
            Forms\Components\TextInput::make('recaptcha_secret_key')->label('reCAPTCHA Secret Key')->password()
                ->visible(fn (Forms\Get $get) => $get('captcha_provider') === 'recaptcha'),
            Forms\Components\TextInput::make('turnstile_website_key')->label('Turnstile Site Key')
                ->visible(fn (Forms\Get $get) => $get('captcha_provider') === 'turnstile'),
            Forms\Components\TextInput::make('turnstile_secret_key')->label('Turnstile Secret Key')->password()
                ->visible(fn (Forms\Get $get) => $get('captcha_provider') === 'turnstile'),
        ])->columns(2)->statePath('securityData');
    }

    public function saveGeneral(): void
    {
        $data = $this->generalForm->getState();
        $settings = app(SettingsRepositoryInterface::class);

        $settings->set('settings::app:name', $data['app_name']);
        $settings->set('settings::app:locale', $data['app_locale']);
        $settings->set('settings::pterodactyl:guzzle:timeout', $data['pterodactyl_guzzle_timeout']);
        $settings->set('settings::pterodactyl:guzzle:connect_timeout', $data['pterodactyl_guzzle_connect_timeout']);

        Notification::make()->title('General settings saved.')->success()->send();
    }

    public function saveMail(): void
    {
        $data = $this->mailForm->getState();
        $settings = app(SettingsRepositoryInterface::class);
        $encrypter = app(Encrypter::class);
        $driver = config('mail.default');

        if ($driver === 'smtp') {
            $settings->set('settings::mail:mailers:smtp:host', $data['smtp_host']);
            $settings->set('settings::mail:mailers:smtp:port', $data['smtp_port']);
            $settings->set('settings::mail:mailers:smtp:encryption', $data['smtp_encryption']);
            $settings->set('settings::mail:mailers:smtp:username', $data['smtp_username']);
            if (!empty($data['smtp_password'])) {
                $settings->set('settings::mail:mailers:smtp:password', $encrypter->encrypt($data['smtp_password']));
            }
        } elseif ($driver === 'resend') {
            if (!empty($data['resend_key'])) {
                $settings->set('settings::services:resend:key', $encrypter->encrypt($data['resend_key']));
            }
        }

        $settings->set('settings::mail:from:address', $data['from_address']);
        $settings->set('settings::mail:from:name', $data['from_name']);

        app(\Illuminate\Contracts\Console\Kernel::class)->call('queue:restart');

        Notification::make()->title('Mail settings saved.')->success()->send();
    }

    public function saveSecurity(): void
    {
        $data = $this->securityForm->getState();
        $settings = app(SettingsRepositoryInterface::class);

        $settings->set('settings::captcha:provider', $data['captcha_provider']);
        $settings->set('settings::pterodactyl:auth:2fa_required', $data['require_2fa']);

        if ($data['captcha_provider'] === 'recaptcha') {
            $settings->set('settings::captcha:recaptcha:website_key', $data['recaptcha_website_key'] ?? '');
            $settings->set('settings::captcha:recaptcha:secret_key', $data['recaptcha_secret_key'] ?? '');
        } elseif ($data['captcha_provider'] === 'turnstile') {
            $settings->set('settings::captcha:turnstile:website_key', $data['turnstile_website_key'] ?? '');
            $settings->set('settings::captcha:turnstile:secret_key', $data['turnstile_secret_key'] ?? '');
        }

        Notification::make()->title('Security settings saved.')->success()->send();
    }

    public function testMail(): void
    {
        try {
            NotificationFacade::route('mail', auth()->user()->email)
                ->notify(new MailTested(auth()->user()));
            Notification::make()->title('Test email sent.')->success()->send();
        } catch (\Exception $e) {
            Notification::make()->title('Failed to send.')->body($e->getMessage())->danger()->send();
        }
    }

    public static function canAccess(): bool
    {
        return auth()->user()?->root_admin ?? false;
    }
}
