<?php

namespace Pterodactyl\Http\Requests\Admin\Settings;

use Pterodactyl\Http\Requests\Admin\AdminFormRequest;

class OAuthSettingsFormRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'oauth:google:enabled' => 'required|in:true,false',
            'oauth:google:client_id' => 'nullable|string|max:191',
            'oauth:google:client_secret' => 'nullable|string|max:191',
            'oauth:discord:enabled' => 'required|in:true,false',
            'oauth:discord:client_id' => 'nullable|string|max:191',
            'oauth:discord:client_secret' => 'nullable|string|max:191',
            'oauth:github:enabled' => 'required|in:true,false',
            'oauth:github:client_id' => 'nullable|string|max:191',
            'oauth:github:client_secret' => 'nullable|string|max:191',
        ];
    }

    public function attributes(): array
    {
        return [
            'oauth:google:enabled' => 'Google OAuth Enabled',
            'oauth:google:client_id' => 'Google Client ID',
            'oauth:google:client_secret' => 'Google Client Secret',
            'oauth:discord:enabled' => 'Discord OAuth Enabled',
            'oauth:discord:client_id' => 'Discord Client ID',
            'oauth:discord:client_secret' => 'Discord Client Secret',
            'oauth:github:enabled' => 'GitHub OAuth Enabled',
            'oauth:github:client_id' => 'GitHub Client ID',
            'oauth:github:client_secret' => 'GitHub Client Secret',
        ];
    }
}
