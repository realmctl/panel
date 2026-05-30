<?php

return [
    /*
    |--------------------------------------------------------------------------
    | CAPTCHA Provider
    |--------------------------------------------------------------------------
    |
    | Supported providers: "recaptcha", "turnstile", "none"
    |
    | - recaptcha: Google reCAPTCHA v2 (invisible). Existing behavior.
    | - turnstile: Cloudflare Turnstile. A privacy-friendly alternative that
    |              does not force mobile QR-code verification.
    | - none:      CAPTCHA disabled entirely. Not recommended for production.
    |
    */
    'provider' => env('CAPTCHA_PROVIDER', env('RECAPTCHA_ENABLED', true) ? 'recaptcha' : 'none'),

    /*
    |--------------------------------------------------------------------------
    | Google reCAPTCHA
    |--------------------------------------------------------------------------
    */
    'recaptcha' => [
        'domain' => env('RECAPTCHA_DOMAIN', 'https://www.google.com/recaptcha/api/siteverify'),
        'secret_key' => env('RECAPTCHA_SECRET_KEY', '6LcJcjwUAAAAALOcDJqAEYKTDhwELCkzUkNDQ0J5'),
        '_shipped_secret_key' => '6LcJcjwUAAAAALOcDJqAEYKTDhwELCkzUkNDQ0J5',
        'website_key' => env('RECAPTCHA_WEBSITE_KEY', '6LcJcjwUAAAAAO_Xqjrtj9wWufUpYRnK6BW8lnfn'),
        '_shipped_website_key' => '6LcJcjwUAAAAAO_Xqjrtj9wWufUpYRnK6BW8lnfn',
        'verify_domain' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Cloudflare Turnstile
    |--------------------------------------------------------------------------
    */
    'turnstile' => [
        'domain' => env('TURNSTILE_DOMAIN', 'https://challenges.cloudflare.com/turnstile/v0/siteverify'),
        'secret_key' => env('TURNSTILE_SECRET_KEY', ''),
        'website_key' => env('TURNSTILE_WEBSITE_KEY', ''),
    ],
];
