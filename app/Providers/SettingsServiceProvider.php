<?php

namespace Realm\Providers;

use Psr\Log\LoggerInterface as Log;
use Illuminate\Database\QueryException;
use Illuminate\Support\ServiceProvider;
use Illuminate\Contracts\Encryption\Encrypter;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Contracts\Config\Repository as ConfigRepository;
use Realm\Contracts\Repository\SettingsRepositoryInterface;

class SettingsServiceProvider extends ServiceProvider
{
    /**
     * An array of configuration keys to override with database values
     * if they exist.
     */
    protected array $keys = [
        'app:name',
        'app:locale',
        'recaptcha:enabled',
        'recaptcha:secret_key',
        'recaptcha:website_key',
        'captcha:provider',
        'captcha:recaptcha:secret_key',
        'captcha:recaptcha:website_key',
        'captcha:turnstile:secret_key',
        'captcha:turnstile:website_key',
        'realm:guzzle:timeout',
        'realm:guzzle:connect_timeout',
        'realm:console:count',
        'realm:console:frequency',
        'realm:auth:2fa_required',
        'realm:auth:registration_enabled',
        'realm:client_features:allocations:enabled',
        'realm:client_features:allocations:range_start',
        'realm:client_features:allocations:range_end',
        'oauth:google:enabled',
        'oauth:google:client_id',
        'oauth:google:client_secret',
        'oauth:discord:enabled',
        'oauth:discord:client_id',
        'oauth:discord:client_secret',
        'oauth:github:enabled',
        'oauth:github:client_id',
        'oauth:github:client_secret',
    ];

    /**
     * Keys specific to the mail driver that are only grabbed from the database
     * when using the SMTP driver.
     */
    protected array $emailKeys = [
        'mail:mailers:smtp:host',
        'mail:mailers:smtp:port',
        'mail:mailers:smtp:encryption',
        'mail:mailers:smtp:username',
        'mail:mailers:smtp:password',
        'mail:from:address',
        'mail:from:name',
    ];

    /**
     * Keys specific to the Resend mail driver.
     */
    protected array $resendKeys = [
        'services:resend:key',
        'mail:from:address',
        'mail:from:name',
    ];

    /**
     * Keys specific to the Mailgun mail driver.
     */
    protected array $mailgunKeys = [
        'services:mailgun:domain',
        'services:mailgun:secret',
        'services:mailgun:endpoint',
        'mail:from:address',
        'mail:from:name',
    ];

    /**
     * Keys specific to the Postmark mail driver.
     */
    protected array $postmarkKeys = [
        'services:postmark:token',
        'mail:from:address',
        'mail:from:name',
    ];

    /**
     * The mail driver key stored in the database.
     */
    protected array $mailDriverKey = [
        'mail:default',
    ];

    /**
     * Keys that are encrypted and should be decrypted when set in the
     * configuration array.
     */
    protected static array $encrypted = [
        'mail:mailers:smtp:password',
        'services:resend:key',
        'services:mailgun:secret',
        'services:postmark:token',
    ];

    /**
     * Boot the service provider.
     */
    public function boot(ConfigRepository $config, Encrypter $encrypter, Log $log, SettingsRepositoryInterface $settings): void
    {
        try {
            $values = $settings->all()->mapWithKeys(function ($setting) {
                return [$setting->key => $setting->value];
            })->toArray();
        } catch (QueryException $exception) {
            $log->notice('A query exception was encountered while trying to load settings from the database: ' . $exception->getMessage());

            return;
        }

        // Determine the active mail driver. The database value takes precedence
        // over the .env value so that switching providers from the UI works.
        $driver = array_get($values, 'settings::mail:default', $config->get('mail.default'));

        // Always include the mail:default key so it gets written to config.
        $this->keys = array_merge($this->keys, $this->mailDriverKey);

        // Load the appropriate email driver settings from the database.
        match ($driver) {
            'smtp' => $this->keys = array_merge($this->keys, $this->emailKeys),
            'resend' => $this->keys = array_merge($this->keys, $this->resendKeys),
            'mailgun' => $this->keys = array_merge($this->keys, $this->mailgunKeys),
            'postmark' => $this->keys = array_merge($this->keys, $this->postmarkKeys),
            default => null,
        };

        foreach ($this->keys as $key) {
            $value = array_get($values, 'settings::' . $key, $config->get(str_replace(':', '.', $key)));
            if (in_array($key, self::$encrypted)) {
                try {
                    $value = $encrypter->decrypt($value);
                } catch (DecryptException $exception) {
                }
            }

            switch (strtolower($value ?? '')) {
                case 'true':
                case '(true)':
                    $value = true;
                    break;
                case 'false':
                case '(false)':
                    $value = false;
                    break;
                case 'empty':
                case '(empty)':
                    $value = '';
                    break;
                case 'null':
                case '(null)':
                    $value = null;
            }

            $config->set(str_replace(':', '.', $key), $value);
        }
    }

    public static function getEncryptedKeys(): array
    {
        return self::$encrypted;
    }
}
