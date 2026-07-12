<?php

namespace Realm\Http\Requests\Admin\Settings;

use Illuminate\Validation\Rule;
use Realm\Traits\Helpers\AvailableLanguages;
use Realm\Http\Requests\Admin\AdminFormRequest;
use Realm\Support\Mail\SupportedMailDrivers;

class BaseSettingsFormRequest extends AdminFormRequest
{
    use AvailableLanguages;

    public function rules(): array
    {
        return [
            'app:name' => 'required|string|max:191',
            'realm:auth:2fa_required' => 'required|integer|in:0,1,2',
            'app:locale' => ['required', 'string', Rule::in(array_keys($this->getAvailableLanguages()))],
            'realm:auth:registration_enabled' => [
                'required',
                'in:true,false',
                function (string $attribute, mixed $value, \Closure $fail) {
                    if ($value === 'true' && !SupportedMailDrivers::isConfigured()) {
                        $fail('User registration requires a working email provider to be configured first, since new accounts must verify their email address. Configure mail settings before enabling registration.');
                    }
                },
            ],
        ];
    }

    public function attributes(): array
    {
        return [
            'app:name' => 'Company Name',
            'realm:auth:2fa_required' => 'Require 2-Factor Authentication',
            'app:locale' => 'Default Language',
            'realm:auth:registration_enabled' => 'User Registration',
        ];
    }
}
