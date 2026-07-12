<?php

namespace Realm\Support\Mail;

class SupportedMailDrivers
{
    public const DRIVERS = ['smtp', 'mailgun', 'postmark', 'resend'];

    /**
     * Determine whether a real (non-log/array) mail provider has been configured
     * with the minimum fields required for it to actually deliver mail. This is
     * used to gate features that depend on outgoing email, such as user
     * registration with mandatory email verification.
     */
    public static function isConfigured(): bool
    {
        $driver = config('mail.default');

        if (!in_array($driver, self::DRIVERS, true) || empty(config('mail.from.address'))) {
            return false;
        }

        return match ($driver) {
            'smtp' => !empty(config('mail.mailers.smtp.host')),
            'mailgun' => !empty(config('services.mailgun.domain')),
            'postmark' => !empty(config('services.postmark.token')),
            'resend' => !empty(config('services.resend.key')),
            default => false,
        };
    }
}
