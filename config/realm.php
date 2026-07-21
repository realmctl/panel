<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Restricted Environment
    |--------------------------------------------------------------------------
    |
    | Set this environment variable to true to enable a restricted configuration
    | setup on the panel. When set to true, configurations stored in the
    | database will not be applied.
    */

    'load_environment_only' => (bool) env('APP_ENVIRONMENT_ONLY', false),

    /*
    |--------------------------------------------------------------------------
    | Service Author
    |--------------------------------------------------------------------------
    |
    | Each panel installation is assigned a unique UUID to identify the
    | author of custom services, and make upgrades easier by identifying
    | standard Realm shipped services.
    */

    'service' => [
        'author' => env('APP_SERVICE_AUTHOR', 'unknown@unknown.com'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Authentication
    |--------------------------------------------------------------------------
    |
    | Should login success and failure events trigger an email to the user?
    */

    'auth' => [
        '2fa_required' => env('APP_2FA_REQUIRED', 0),
        '2fa' => [
            'bytes' => 32,
            'window' => env('APP_2FA_WINDOW', 4),
            'verify_newer' => true,
        ],
        'registration_enabled' => (bool) env('APP_REGISTRATION_ENABLED', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    |
    | Certain pagination result counts can be configured here and will take
    | effect globally.
    */

    'paginate' => [
        'frontend' => [
            'servers' => env('APP_PAGINATE_FRONT_SERVERS', 15),
        ],
        'admin' => [
            'servers' => env('APP_PAGINATE_ADMIN_SERVERS', 25),
            'users' => env('APP_PAGINATE_ADMIN_USERS', 25),
        ],
        'api' => [
            'nodes' => env('APP_PAGINATE_API_NODES', 25),
            'servers' => env('APP_PAGINATE_API_SERVERS', 25),
            'users' => env('APP_PAGINATE_API_USERS', 25),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Guzzle Connections
    |--------------------------------------------------------------------------
    |
    | Configure the timeout to be used for Guzzle connections here.
    */

    'guzzle' => [
        'timeout' => env('GUZZLE_TIMEOUT', 15),
        'connect_timeout' => env('GUZZLE_CONNECT_TIMEOUT', 5),
    ],

    /*
    |--------------------------------------------------------------------------
    | CDN
    |--------------------------------------------------------------------------
    |
    | Information for the panel to use when contacting the CDN to confirm
    | if panel is up to date.
    */

    'cdn' => [
        'cache_time' => 60,
        'url' => 'https://cdn.ordnary.com/realmctl/latest.json',
    ],

    /*
    |--------------------------------------------------------------------------
    | Client Features
    |--------------------------------------------------------------------------
    |
    | Allow clients to create their own databases.
    */

    'client_features' => [
        'databases' => [
            'enabled' => env('REALM_CLIENT_DATABASES_ENABLED', true),
            'allow_random' => env('REALM_CLIENT_DATABASES_ALLOW_RANDOM', true),
        ],

        'schedules' => [
            // The total number of tasks that can exist for any given schedule at once.
            'per_schedule_task_limit' => env('REALM_PER_SCHEDULE_TASK_LIMIT', 10),
        ],

        'allocations' => [
            'enabled' => env('REALM_CLIENT_ALLOCATIONS_ENABLED', false),
            'range_start' => env('REALM_CLIENT_ALLOCATIONS_RANGE_START'),
            'range_end' => env('REALM_CLIENT_ALLOCATIONS_RANGE_END'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | File Editor
    |--------------------------------------------------------------------------
    |
    | This array includes the MIME filetypes that can be edited via the web.
    */

    'files' => [
        'max_edit_size' => env('REALM_FILES_MAX_EDIT_SIZE', 1024 * 1024 * 4),
        'revisions' => [
            // Maximum number of revisions to keep per file. Set to null to disable.
            'max_per_file' => env('REALM_FILE_REVISIONS_MAX_PER_FILE', null),
            // Maximum age of revisions in days. Set to null to disable.
            'max_age_days' => env('REALM_FILE_REVISIONS_MAX_AGE_DAYS', null),
            // Maximum total revision storage per server in bytes. Set to null to disable.
            'max_storage_per_server' => env('REALM_FILE_REVISIONS_MAX_STORAGE', null),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Dynamic Environment Variables
    |--------------------------------------------------------------------------
    |
    | Place dynamic environment variables here that should be auto-appended
    | to server environment fields when the server is created or updated.
    |
    | Items should be in 'key' => 'value' format, where key is the environment
    | variable name, and value is the server-object key. For example:
    |
    | 'P_SERVER_CREATED_AT' => 'created_at'
    */

    'environment_variables' => [
        'P_SERVER_ALLOCATION_LIMIT' => 'allocation_limit',
    ],

    /*
    |--------------------------------------------------------------------------
    | Asset Verification
    |--------------------------------------------------------------------------
    |
    | This section controls the output format for JS & CSS assets.
    */

    'assets' => [
        'use_hash' => env('REALM_USE_ASSET_HASH', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Email Notification Settings
    |--------------------------------------------------------------------------
    |
    | This section controls what notifications are sent to users.
    */

    'email' => [
        // Should an email be sent to a server owner once their server has completed it's first install process?
        'send_install_notification' => env('REALM_SEND_INSTALL_NOTIFICATION', true),
        // Should an email be sent to a server owner whenever their server is reinstalled?
        'send_reinstall_notification' => env('REALM_SEND_REINSTALL_NOTIFICATION', true),
    ],

    'features' => [
        'new_server_identifiers' => (bool) env('REALM_USE_SERVER_IDENTIFIERS', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Demo Mode
    |--------------------------------------------------------------------------
    |
    | When enabled, an hourly scheduled task wipes all user-generated content
    | (users, servers, subusers, api/ssh keys, backups, activity, etc.) and
    | reseeds a single admin account plus one demo server from scratch. The
    | demo server's Docker container and volume are also wiped and recreated
    | on the node. Nodes, locations, nests, and eggs are treated as static
    | infrastructure and are never touched by the reset.
    |
    | Visitors can hit the demo auto-login endpoint to be signed in as the
    | shared demo admin account without a password.
    */

    'demo_mode' => [
        'enabled' => (bool) env('REALM_DEMO_MODE', false),
        'reset_interval_minutes' => (int) env('REALM_DEMO_RESET_INTERVAL_MINUTES', 60),

        'admin' => [
            'email' => env('REALM_DEMO_ADMIN_EMAIL', 'demo@realmctl.com'),
            'username' => env('REALM_DEMO_ADMIN_USERNAME', 'demo'),
            'name_first' => env('REALM_DEMO_ADMIN_NAME_FIRST', 'Demo'),
            'name_last' => env('REALM_DEMO_ADMIN_NAME_LAST', 'Admin'),
            // Not used for login (visitors use the auto-login endpoint), but
            // the users table requires a password hash to exist.
            'password' => env('REALM_DEMO_ADMIN_PASSWORD'),
        ],

        'server' => [
            'name' => env('REALM_DEMO_SERVER_NAME', 'Demo Server'),
            // Matches the "name" column of an already-seeded egg (see EggSeeder).
            'egg_name' => env('REALM_DEMO_SERVER_EGG', 'Vanilla Minecraft'),
            'memory' => (int) env('REALM_DEMO_SERVER_MEMORY', 2048),
            'swap' => (int) env('REALM_DEMO_SERVER_SWAP', 0),
            'disk' => (int) env('REALM_DEMO_SERVER_DISK', 4096),
            'io' => (int) env('REALM_DEMO_SERVER_IO', 500),
            'cpu' => (int) env('REALM_DEMO_SERVER_CPU', 200),
        ],
    ],
];
