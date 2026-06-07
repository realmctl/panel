<?php

namespace Realm\Http\Requests\Admin\Settings;

use Illuminate\Validation\Rule;
use Realm\Http\Requests\Admin\AdminFormRequest;
use Realm\Support\Mail\SupportedMailDrivers;

class MailSettingsFormRequest extends AdminFormRequest
{
    /**
     * Return rules to validate mail settings POST data against.
     */
    public function rules(): array
    {
        $driver = $this->input('mail:default', config('mail.default'));

        $rules = [
            'mail:default' => ['required', 'string', Rule::in(SupportedMailDrivers::DRIVERS)],
            'mail:from:address' => 'required|string|email',
            'mail:from:name' => 'nullable|string|max:191',
        ];

        return match ($driver) {
            'smtp' => array_merge($rules, [
                'mail:mailers:smtp:host' => 'required|string',
                'mail:mailers:smtp:port' => 'required|integer|between:1,65535',
                'mail:mailers:smtp:encryption' => ['present', Rule::in([null, '', 'tls', 'ssl'])],
                'mail:mailers:smtp:username' => 'nullable|string|max:191',
                'mail:mailers:smtp:password' => 'nullable|string|max:191',
            ]),
            'mailgun' => array_merge($rules, [
                'services:mailgun:domain' => 'required|string|max:191',
                'services:mailgun:secret' => 'nullable|string|max:191',
                'services:mailgun:endpoint' => 'required|string|max:191',
            ]),
            'postmark' => array_merge($rules, [
                'services:postmark:token' => 'nullable|string|max:191',
            ]),
            'resend' => array_merge($rules, [
                'services:resend:key' => 'nullable|string|max:191',
            ]),
            default => $rules,
        };
    }

    /**
     * Override the default normalization function for this type of request
     * as we need to accept empty values on the keys, and skip secret fields
     * when left empty (to avoid overwriting existing values).
     */
    public function normalize(?array $only = null): array
    {
        $keys = array_flip(array_keys($this->rules()));

        // Don't overwrite secrets if left empty.
        $secretFields = [
            'mail:mailers:smtp:password',
            'services:resend:key',
            'services:mailgun:secret',
            'services:postmark:token',
        ];

        foreach ($secretFields as $field) {
            if (isset($keys[$field]) && empty($this->input($field))) {
                unset($keys[$field]);
            }
        }

        return $this->only(array_flip($keys));
    }
}
