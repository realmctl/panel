<?php

namespace Realm\Http\Requests\Admin\Settings;

use Realm\Http\Requests\Admin\AdminFormRequest;

class SecuritySettingsFormRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'captcha:provider' => 'required|in:recaptcha,turnstile,none',
            'captcha:recaptcha:secret_key' => 'required_if:captcha:provider,recaptcha|nullable|string|max:191',
            'captcha:recaptcha:website_key' => 'required_if:captcha:provider,recaptcha|nullable|string|max:191',
            'captcha:turnstile:secret_key' => 'required_if:captcha:provider,turnstile|nullable|string|max:191',
            'captcha:turnstile:website_key' => 'required_if:captcha:provider,turnstile|nullable|string|max:191',
            'realm:guzzle:timeout' => 'required|integer|between:1,60',
            'realm:guzzle:connect_timeout' => 'required|integer|between:1,60',
        ];
    }

    public function attributes(): array
    {
        return [
            'captcha:provider' => 'CAPTCHA Provider',
            'captcha:recaptcha:secret_key' => 'reCAPTCHA Secret Key',
            'captcha:recaptcha:website_key' => 'reCAPTCHA Website Key',
            'captcha:turnstile:secret_key' => 'Turnstile Secret Key',
            'captcha:turnstile:website_key' => 'Turnstile Website Key',
            'realm:guzzle:timeout' => 'HTTP Request Timeout',
            'realm:guzzle:connect_timeout' => 'HTTP Connection Timeout',
        ];
    }
}
