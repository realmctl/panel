<?php

namespace Pterodactyl\Http\Controllers\Admin\Settings;

use Exception;
use Pterodactyl\Exceptions\Model\DataValidationException;
use Pterodactyl\Exceptions\Repository\RecordNotFoundException;
use Illuminate\View\View;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Contracts\Console\Kernel;
use Pterodactyl\Notifications\MailTested;
use Illuminate\Support\Facades\Notification;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Http\Controllers\Controller;
use Illuminate\Contracts\Encryption\Encrypter;
use Pterodactyl\Providers\SettingsServiceProvider;
use Illuminate\Contracts\Config\Repository as ConfigRepository;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;
use Pterodactyl\Http\Requests\Admin\Settings\MailSettingsFormRequest;

class MailController extends Controller
{
    /**
     * Supported mail drivers that can be configured via the UI.
     */
    public const SUPPORTED_DRIVERS = ['smtp', 'mailgun', 'postmark', 'resend'];

    /**
     * MailController constructor.
     */
    public function __construct(
        private ConfigRepository $config,
        private Encrypter $encrypter,
        private Kernel $kernel,
        private SettingsRepositoryInterface $settings,
    ) {
    }

    /**
     * Render UI for editing mail settings.
     */
    public function index(): View
    {
        $driver = $this->config->get('mail.default');

        return view('admin.settings.mail', [
            'disabled' => !in_array($driver, self::SUPPORTED_DRIVERS),
            'driver' => $driver,
            'providers' => self::SUPPORTED_DRIVERS,
        ]);
    }

    /**
     * Handle request to update mail settings.
     *
     * @throws DisplayException
     * @throws DataValidationException
     * @throws RecordNotFoundException
     */
    public function update(MailSettingsFormRequest $request): Response
    {
        $values = $request->normalize();

        // Handle the special "clear password" sentinel value for SMTP.
        if (array_get($values, 'mail:mailers:smtp:password') === '!e') {
            $values['mail:mailers:smtp:password'] = '';
        }

        foreach ($values as $key => $value) {
            if (in_array($key, SettingsServiceProvider::getEncryptedKeys()) && !empty($value)) {
                $value = $this->encrypter->encrypt($value);
            }

            $this->settings->set('settings::' . $key, $value);
        }

        $this->kernel->call('queue:restart');

        return response('', 204);
    }

    /**
     * Submit a request to send a test mail message.
     */
    public function test(Request $request): Response
    {
        try {
            Notification::route('mail', $request->user()->email)
                ->notify(new MailTested($request->user()));
        } catch (Exception $exception) {
            return response($exception->getMessage(), 500);
        }

        return response('', 204);
    }
}
