<?php

namespace Pterodactyl\Http\Requests\Admin\Settings;

use Pterodactyl\Http\Requests\Admin\AdminFormRequest;

class AdvancedSettingsFormRequest extends AdminFormRequest
{
    /**
     * Return all the rules to apply to this request's data.
     */
    public function rules(): array
    {
        return [
            'captcha:provider' => 'required|in:recaptcha,turnstile,none',
            'captcha:recaptcha:secret_key' => 'required_if:captcha:provider,recaptcha|nullable|string|max:191',
            'captcha:recaptcha:website_key' => 'required_if:captcha:provider,recaptcha|nullable|string|max:191',
            'captcha:turnstile:secret_key' => 'required_if:captcha:provider,turnstile|nullable|string|max:191',
            'captcha:turnstile:website_key' => 'required_if:captcha:provider,turnstile|nullable|string|max:191',
            'pterodactyl:guzzle:timeout' => 'required|integer|between:1,60',
            'pterodactyl:guzzle:connect_timeout' => 'required|integer|between:1,60',
            'pterodactyl:client_features:allocations:enabled' => 'required|in:true,false',
            'pterodactyl:client_features:allocations:range_start' => [
                'nullable',
                'required_if:pterodactyl:client_features:allocations:enabled,true',
                'integer',
                'between:1024,65535',
            ],
            'pterodactyl:client_features:allocations:range_end' => [
                'nullable',
                'required_if:pterodactyl:client_features:allocations:enabled,true',
                'integer',
                'between:1024,65535',
                'gt:pterodactyl:client_features:allocations:range_start',
            ],
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
            'pterodactyl:guzzle:timeout' => 'HTTP Request Timeout',
            'pterodactyl:guzzle:connect_timeout' => 'HTTP Connection Timeout',
            'pterodactyl:client_features:allocations:enabled' => 'Auto Create Allocations Enabled',
            'pterodactyl:client_features:allocations:range_start' => 'Starting Port',
            'pterodactyl:client_features:allocations:range_end' => 'Ending Port',
        ];
    }
}
