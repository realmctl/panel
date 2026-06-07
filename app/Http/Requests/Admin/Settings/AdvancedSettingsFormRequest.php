<?php

namespace Realm\Http\Requests\Admin\Settings;

use Realm\Http\Requests\Admin\AdminFormRequest;

class AdvancedSettingsFormRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'realm:client_features:allocations:enabled' => 'required|in:true,false',
            'realm:client_features:allocations:range_start' => [
                'nullable',
                'required_if:realm:client_features:allocations:enabled,true',
                'integer',
                'between:1024,65535',
            ],
            'realm:client_features:allocations:range_end' => [
                'nullable',
                'required_if:realm:client_features:allocations:enabled,true',
                'integer',
                'between:1024,65535',
                'gt:realm:client_features:allocations:range_start',
            ],
        ];
    }

    public function attributes(): array
    {
        return [
            'realm:client_features:allocations:enabled' => 'Auto Create Allocations Enabled',
            'realm:client_features:allocations:range_start' => 'Starting Port',
            'realm:client_features:allocations:range_end' => 'Ending Port',
        ];
    }
}
