<?php

namespace Pterodactyl\Filament\Pages\Settings;

use Filament\Forms;
use Filament\Forms\Form;
use Filament\Pages\Page;
use Filament\Actions\Action;
use Filament\Notifications\Notification;
use Pterodactyl\Notifications\MailTested;
use Illuminate\Support\Facades\Notification as NotificationFacade;
use Illuminate\Contracts\Encryption\Encrypter;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;

class MailSettings extends Page implements Forms\Contracts\HasForms
{
    use Forms\Concerns\InteractsWithForms;

    protected static ?string $navigationIcon = 'heroicon-o-envelope';

    protected static ?string $navigationGroup = 'Configuration';

    protected static ?string $navigationLabel = 'Mail';

    protected static ?int $navigationSort = 2;

    protected static string $view = 'filament.pages.settings';

    public ?array $data = [];

    public function mount(): void
    {
        $this->form->fill([
            'driver' => config('mail.default'),
            'smtp_host' => config('mail.mailers.smtp.host'),
            'smtp_port' => config('mail.mailers.smtp.port'),
            'smtp_encryption' => config('mail.mailers.smtp.encryption'),
            'smtp_username' => config('mail.mailers.smtp.username'),
            'from_address' => config('mail.from.address'),
            'from_name' => config('mail.from.name'),
        ]);
    }

    public function form(Form $form): Form
    {
        $driver = config('mail.default');

        $fields = [
            Forms\Components\Placeholder::make('current_driver')
                ->label('Active Mail Driver')
                ->content(strtoupper($driver)),
        ];

        if ($driver === 'smtp') {
            $fields = array_merge($fields, [
                Forms\Components\TextInput::make('smtp_host')->label('SMTP Host')->required(),
                Forms\Components\TextInput::make('smtp_port')->label('SMTP Port')->numeric()->required(),
                Forms\Components\Select::make('smtp_encryption')->label('Encryption')
                    ->options(['' => 'None', 'tls' => 'TLS', 'ssl' => 'SSL']),
                Forms\Components\TextInput::make('smtp_username')->label('Username'),
                Forms\Components\TextInput::make('smtp_password')->label('Password')->password()
                    ->helperText('Leave blank to keep current password.'),
            ]);
        } elseif ($driver === 'resend') {
            $fields[] = Forms\Components\TextInput::make('resend_key')
                ->label('Resend API Key')
                ->password()
                ->helperText('Leave blank to keep current key.');
        }

        $fields[] = Forms\Components\TextInput::make('from_address')->label('From Address')->email()->required();
        $fields[] = Forms\Components\TextInput::make('from_name')->label('From Name');

        return $form->schema([
            Forms\Components\Section::make('Mail Configuration')->schema($fields)->columns(2),
        ])->statePath('data');
    }

    public function save(): void
    {
        $data = $this->form->getState();
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
            Action::make('test')
                ->label('Send Test')
                ->color('success')
                ->action('testMail'),
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
