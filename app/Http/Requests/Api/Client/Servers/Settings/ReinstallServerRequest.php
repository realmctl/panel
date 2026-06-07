<?php

namespace Realm\Http\Requests\Api\Client\Servers\Settings;

use Realm\Models\Permission;
use Realm\Http\Requests\Api\Client\ClientApiRequest;

class ReinstallServerRequest extends ClientApiRequest
{
    public function permission(): string
    {
        return Permission::ACTION_SETTINGS_REINSTALL;
    }
}
