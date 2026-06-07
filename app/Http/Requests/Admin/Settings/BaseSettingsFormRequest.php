<?php

namespace Realm\Http\Requests\Admin\Settings;

use Illuminate\Validation\Rule;
use Realm\Traits\Helpers\AvailableLanguages;
use Realm\Http\Requests\Admin\AdminFormRequest;

class BaseSettingsFormRequest extends AdminFormRequest
{
    use AvailableLanguages;

    public function rules(): array
    {
        return [
            'app:name' => 'required|string|max:191',
            'realm:auth:2fa_required' => 'required|integer|in:0,1,2',
            'app:locale' => ['required', 'string', Rule::in(array_keys($this->getAvailableLanguages()))],
            'realm:auth:registration_enabled' => 'required|in:true,false',
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
