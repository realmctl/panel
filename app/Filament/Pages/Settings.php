<?php

namespace Pterodactyl\Filament\Pages;

use BackedEnum;
use Filament\Forms;
use Filament\Pages\Page;
use Filament\Actions\Action;
use Filament\Schemas\Schema;
use Filament\Schemas\Components\Tabs;
use Filament\Schemas\Components\Tabs\Tab;
use Filament\Schemas\Components\Utilities\Get;
use Filament\Notifications\Notification;
use Pterodactyl\Notifications\MailTested;
use Illuminate\Support\Facades\Notification as NotificationFacade;
use Illuminate\Contracts\Encryption\Encrypter;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;

class Settings extends Page implements Forms\Contracts\HasForms
{
    use Forms\Concerns\InteractsWithForms;

    protected static string|BackedEnum|null $navigationIcon = 'heroicon-o-cog-6-tooth';

    protected static ?string $navigationLabel = 'Settings';

    protected static ?string $title = 'Settings';

    protected static ?int $navigationSort = 99;

    protected static string $view = 'filament.pages.settings-page';

    public ?array $data = [];

    public function mount(): void
    {
        $driver = config('mail.default');

        $this->form->fill([
            // General
            'app_name' => config('app.name'),
            'app_locale' => config('app.locale'),
            'pterodactyl_guzzle_timeout' => config('pterodactyl.guzzle.timeout'),
            'pterodactyl_guzzle_connect_timeout' => config('pterodactyl.guzzle.connect_timeout'),
            // Mail
            'mail_driver' => $driver,
            'smtp_host' => config('mail.mailers.smtp.host'),
            'smtp_port' => config('mail.mailers.smtp.port'),
            'smtp_encryption' => config('mail.mailers.smtp.encryption'),
            'smtp_username' => config('mail.mailers.smtp.username'),
            'from_address' => config('mail.from.address'),
            'from_name' => config('mail.from.name'),
            // Security
            'captcha_provider' => config('captcha.provider', 'recaptcha'),
            'recaptcha_website_key' => config('captcha.recaptcha.website_key'),
            'recaptcha_secret_key' => '',
            'turnstile_website_key' => config('captcha.turnstile.website_key'),
            'turnstile_secret_key' => '',
            'require_2fa' => (string) config('pterodactyl.auth.2fa_required', '0'),
        ]);
    }

    public function form(Schema $schema): Schema
    {
        return $schema->components([
            Tabs::make('Settings')
                ->tabs([
                    Tab::make('General')
                        ->icon('heroicon-o-cog-6-tooth')
                        ->schema([
                            Forms\Components\TextInput::make('app_name')->label('Panel Name')->required()->columnSpan(1),
                            Forms\Components\Select::make('app_locale')->label('Language')
                                ->options(['en' => 'English', 'nl' => 'Dutch', 'de' => 'German', 'fr' => 'French', 'es' => 'Spanish'])
                                ->required()->columnSpan(1),
                            Forms\Components\TextInput::make('pterodactyl_guzzle_timeout')->label('Request Timeout (s)')->numeric()->required()->columnSpan(1),
                            Forms\Components\TextInput::make('pterodactyl_guzzle_connect_timeout')->label('Connect Timeout (s)')->numeric()->required()->columnSpan(1),
                        ])->columns(2),

                    Tab::make('Mail')
                        ->icon('heroicon-o-envelope')
                        ->schema([
                            Forms\Components\Select::make('mail_driver')->label('Mail Driver')
                                ->options([
                                    'smtp' => 'SMTP',
                                    'resend' => 'Resend',
                                    'sendmail' => 'Sendmail',
                                    'mailgun' => 'Mailgun',
                                    'postmark' => 'Postmark',
                                ])
                                ->required()
                                ->live()
                                ->columnSpan(2),
                            Forms\Components\TextInput::make('smtp_host')->label('SMTP Host')->required()
                                ->visible(fn (Get $get) => $get('mail_driver') === 'smtp'),
                            Forms\Components\TextInput::make('smtp_port')->label('SMTP Port')->numeric()->required()
                                ->visible(fn (Get $get) => $get('mail_driver') === 'smtp'),
                            Forms\Components\Select::make('smtp_encryption')->label('Encryption')
                                ->options(['' => 'None', 'tls' => 'TLS', 'ssl' => 'SSL'])
                                ->visible(fn (Get $get) => $get('mail_driver') === 'smtp'),
                            Forms\Components\TextInput::make('smtp_username')->label('Username')
                                ->visible(fn (Get $get) => $get('mail_driver') === 'smtp'),
                            Forms\Components\TextInput::make('smtp_password')->label('Password')->password()
                                ->helperText('Leave blank to keep current.')
                                ->visible(fn (Get $get) => $get('mail_driver') === 'smtp'),
                            Forms\Components\TextInput::make('resend_key')->label('Resend API Key')->password()
                                ->helperText('Leave blank to keep current.')
                                ->visible(fn (Get $get) => $get('mail_driver') === 'resend'),
                            Forms\Components\TextInput::make('from_address')->label('From Address')->email()->required(),
                            Forms\Components\TextInput::make('from_name')->label('From Name'),
                        ])
                        ->columns(2),

                    Tab::make('Security')
                        ->icon('heroicon-o-shield-check')
                        ->schema([
                            Forms\Components\Select::make('captcha_provider')->label('CAPTCHA Provider')
                                ->options(['none' => 'Disabled', 'recaptcha' => 'reCAPTCHA', 'turnstile' => 'Cloudflare Turnstile'])
                                ->live()->columnSpan(1),
                            Forms\Components\Select::make('require_2fa')->label('Require 2FA')
                                ->options(['0' => 'Not Required', '1' => 'Admin Only', '2' => 'All Users'])->columnSpan(1),
                            Forms\Components\TextInput::make('recaptcha_website_key')->label('reCAPTCHA Site Key')
                                ->visible(fn (Get $get) => $get('captcha_provider') === 'recaptcha')->columnSpan(1),
                            Forms\Components\TextInput::make('recaptcha_secret_key')->label('reCAPTCHA Secret Key')->password()
                                ->visible(fn (Get $get) => $get('captcha_provider') === 'recaptcha')
                                ->helperText('Leave blank to keep current.')->columnSpan(1),
                            Forms\Components\TextInput::make('turnstile_website_key')->label('Turnstile Site Key')
                                ->visible(fn (Get $get) => $get('captcha_provider') === 'turnstile')->columnSpan(1),
                            Forms\Components\TextInput::make('turnstile_secret_key')->label('Turnstile Secret Key')->password()
                                ->visible(fn (Get $get) => $get('captcha_provider') === 'turnstile')
                                ->helperText('Leave blank to keep current.')->columnSpan(1),
                        ])->columns(2),
                ])
                ->persistTabInQueryString()
                ->columnSpanFull(),
        ])->statePath('data');
    }

    public function save(): void
    {
        $data = $this->form->getState();
        $settings = app(SettingsRepositoryInterface::class);
        $encrypter = app(Encrypter::class);
        $driver = $data['mail_driver'];

        // General
        $settings->set('settings::app:name', $data['app_name']);
        $settings->set('settings::app:locale', $data['app_locale']);
        $settings->set('settings::pterodactyl:guzzle:timeout', $data['pterodactyl_guzzle_timeout']);
        $settings->set('settings::pterodactyl:guzzle:connect_timeout', $data['pterodactyl_guzzle_connect_timeout']);

        // Mail - update .env for driver change
        $this->writeEnvValue('MAIL_MAILER', $driver);

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

        // Security
        $settings->set('settings::captcha:provider', $data['captcha_provider']);
        $settings->set('settings::pterodactyl:auth:2fa_required', $data['require_2fa']);
        if ($data['captcha_provider'] === 'recaptcha') {
            $settings->set('settings::captcha:recaptcha:website_key', $data['recaptcha_website_key'] ?? '');
            if (!empty($data['recaptcha_secret_key'])) {
                $settings->set('settings::captcha:recaptcha:secret_key', $data['recaptcha_secret_key']);
            }
        } elseif ($data['captcha_provider'] === 'turnstile') {
            $settings->set('settings::captcha:turnstile:website_key', $data['turnstile_website_key'] ?? '');
            if (!empty($data['turnstile_secret_key'])) {
                $settings->set('settings::captcha:turnstile:secret_key', $data['turnstile_secret_key']);
            }
        }

        app(\Illuminate\Contracts\Console\Kernel::class)->call('queue:restart');

        Notification::make()->title('Settings saved successfully.')->success()->send();
    }

    public function testMail(): void
    {
        try {
            NotificationFacade::route('mail', auth()->user()->email)
                ->notify(new MailTested(auth()->user()));
            Notification::make()->title('Test email sent successfully.')->success()->send();
        } catch (\Exception $e) {
            Notification::make()->title('Failed to send test email.')->body($e->getMessage())->danger()->send();
        }
    }

    protected function getHeaderActions(): array
    {
        return [
            Action::make('testMail')
                ->label('Test Mail')
                ->icon('heroicon-o-paper-airplane')
                ->color('success')
                ->action('testMail'),
            Action::make('save')
                ->label('Save Settings')
                ->icon('heroicon-o-check')
                ->action('save'),
        ];
    }

    public static function canAccess(): bool
    {
        return auth()->user()?->root_admin ?? false;
    }

    /**
     * Write a single value to the .env file.
     */
    private function writeEnvValue(string $key, ?string $value): void
    {
        $path = base_path('.env');
        if (!file_exists($path)) {
            return;
        }

        $escaped = $value;
        if (!is_null($value) && preg_match('/([^\w.\-+\/])+/', $value)) {
            $escaped = '"' . addslashes($value) . '"';
        }

        $contents = file_get_contents($path);
        $entry = $key . '=' . ($escaped ?? '');

        if (preg_match('/^' . $key . '=(.*)$/m', $contents)) {
            $contents = preg_replace('/^' . $key . '=(.*)$/m', $entry, $contents);
        } else {
            $contents .= PHP_EOL . $entry;
        }

        file_put_contents($path, $contents);
    }
}
