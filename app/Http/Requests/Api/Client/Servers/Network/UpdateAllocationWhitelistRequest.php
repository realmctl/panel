<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Network;

use Pterodactyl\Models\Permission;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class UpdateAllocationWhitelistRequest extends ClientApiRequest
{
    public function permission(): string
    {
        return Permission::ACTION_ALLOCATION_UPDATE;
    }

    public function rules(): array
    {
        return [
            'whitelist_enabled' => 'required|boolean',
            'protocol' => 'required|in:tcp,udp,both',
            'allowed_ips' => 'present|array|max:100',
            'allowed_ips.*' => ['string', 'regex:/^(\d{1,3}\.){3}\d{1,3}(\/([0-9]|[1-2][0-9]|3[0-2]))?$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'allowed_ips.*.regex' => 'Each entry must be a valid IPv4 address or CIDR notation (e.g. 192.168.1.1 or 10.0.0.0/24).',
        ];
    }
}
