<?php

return [
    /*
    |--------------------------------------------------------------------------
    | OAuth Providers
    |--------------------------------------------------------------------------
    |
    | Configure which OAuth providers are enabled for user authentication.
    | Each provider requires a client ID and client secret from the respective
    | service's developer console.
    |
    */

    'google' => [
        'enabled' => (bool) env('OAUTH_GOOGLE_ENABLED', false),
        'client_id' => env('OAUTH_GOOGLE_CLIENT_ID', ''),
        'client_secret' => env('OAUTH_GOOGLE_CLIENT_SECRET', ''),
    ],

    'discord' => [
        'enabled' => (bool) env('OAUTH_DISCORD_ENABLED', false),
        'client_id' => env('OAUTH_DISCORD_CLIENT_ID', ''),
        'client_secret' => env('OAUTH_DISCORD_CLIENT_SECRET', ''),
    ],

    'github' => [
        'enabled' => (bool) env('OAUTH_GITHUB_ENABLED', false),
        'client_id' => env('OAUTH_GITHUB_CLIENT_ID', ''),
        'client_secret' => env('OAUTH_GITHUB_CLIENT_SECRET', ''),
    ],
];
