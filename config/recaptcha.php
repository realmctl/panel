<?php

/*
|--------------------------------------------------------------------------
| reCAPTCHA Configuration (Deprecated)
|--------------------------------------------------------------------------
|
| This file is kept for backward compatibility. The panel now uses
| config/captcha.php with multi-provider support.
|
| To migrate: set CAPTCHA_PROVIDER=recaptcha in your .env and configure
| keys via RECAPTCHA_SECRET_KEY / RECAPTCHA_WEBSITE_KEY.
|
*/

return [
    'enabled' => env('CAPTCHA_PROVIDER', env('RECAPTCHA_ENABLED', true) ? 'recaptcha' : 'none') === 'recaptcha',
    'domain' => env('RECAPTCHA_DOMAIN', 'https://www.google.com/recaptcha/api/siteverify'),
    'secret_key' => env('RECAPTCHA_SECRET_KEY', '6LcJcjwUAAAAALOcDJqAEYKTDhwELCkzUkNDQ0J5'),
    '_shipped_secret_key' => '6LcJcjwUAAAAALOcDJqAEYKTDhwELCkzUkNDQ0J5',
    'website_key' => env('RECAPTCHA_WEBSITE_KEY', '6LcJcjwUAAAAAO_Xqjrtj9wWufUpYRnK6BW8lnfn'),
    '_shipped_website_key' => '6LcJcjwUAAAAAO_Xqjrtj9wWufUpYRnK6BW8lnfn',
    'verify_domain' => true,
];
