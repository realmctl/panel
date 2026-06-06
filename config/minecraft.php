<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Minecraft Server Status (mcsrvstat.us)
    |--------------------------------------------------------------------------
    |
    | Used to query online players, MOTD, version, and other live server data.
    | https://api.mcsrvstat.us/
    |
    */
    'status' => [
        'base_url' => env('MINECRAFT_STATUS_API_URL', 'https://api.mcsrvstat.us'),
        'api_version' => env('MINECRAFT_STATUS_API_VERSION', 3),
        'user_agent' => env('MINECRAFT_STATUS_USER_AGENT', 'RealmPanel/1.0 (minecraft-players)'),
        'timeout' => (int) env('MINECRAFT_STATUS_TIMEOUT', 8),
        'cache_ttl' => (int) env('MINECRAFT_STATUS_CACHE_TTL', 30),
    ],

    /*
    |--------------------------------------------------------------------------
    | Player Avatars (Crafthead)
    |--------------------------------------------------------------------------
    |
    | CDN for Minecraft player heads and body renders. Accepts UUID or username.
    | https://crafthead.net/
    |
    */
    'avatars' => [
        'provider' => 'crafthead',
        'base_url' => env('MINECRAFT_AVATAR_BASE_URL', 'https://crafthead.net'),
        'sizes' => [
            'head' => (int) env('MINECRAFT_AVATAR_HEAD_SIZE', 64),
            'helm' => (int) env('MINECRAFT_AVATAR_HELM_SIZE', 64),
            'body' => (int) env('MINECRAFT_AVATAR_BODY_SIZE', 128),
        ],
    ],
];
