<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Title
    |--------------------------------------------------------------------------
    | Here you can change the default title of your admin panel.
    |
    */

    'title' => 'Realm',
    'title_prefix' => '',
    'title_postfix' => ' - Realm Panel',
    'bottom_title' => 'Realm Software',
    'current_version' => 'v1.0',


    /*
    |--------------------------------------------------------------------------
    | Admin Panel Logo
    |--------------------------------------------------------------------------
    |
    | Here you can change the logo of your admin panel.
    |
    */

    'logo' => '<img src="https://cdn.ordnary.com/realmctl/logo.png" alt="Realm" height="32">',
    'logo_img_alt' => 'Realm Panel',

    /*
    |--------------------------------------------------------------------------
    | Authentication Logo
    |--------------------------------------------------------------------------
    |
    | Here you can set up an alternative logo to use on your login and register
    | screens. When disabled, the admin panel logo will be used instead.
    |
    */

    'auth_logo' => [
        'enabled' => false,
        'img' => [
            'path' => 'assets/tablar-logo.png',
            'alt' => 'Auth Logo',
            'class' => '',
            'width' => 50,
            'height' => 50,
        ],
    ],

    /*
     *
     * Default path is 'resources/views/vendor/tablar' as null. Set your custom path here If you need.
     */

    'views_path' => null,

    /*
    |--------------------------------------------------------------------------
    | Layout
    |--------------------------------------------------------------------------
    | Here we change the layout of your admin panel.
    |
    | For detailed instructions you can look at the layout section here:
    |
    */

    'layout' => 'horizontal',
    //boxed, combo, condensed, fluid, fluid-vertical, horizontal, navbar-overlap, navbar-sticky, rtl, vertical, vertical-right, vertical-transparent

    'layout_light_sidebar' => null,
    'layout_light_topbar' => true,
    'layout_enable_top_header' => false,

    /*
    |--------------------------------------------------------------------------
    | Sticky Navbar for Top Nav
    |--------------------------------------------------------------------------
    |
    | Here you can enable/disable the sticky functionality of Top Navigation Bar.
    |
    | For detailed instructions, you can look at the Top Navigation Bar classes here:
    |
    */

    'sticky_top_nav_bar' => false,

    /*
    |--------------------------------------------------------------------------
    | Admin Panel Classes
    |--------------------------------------------------------------------------
    |
    | Here you can change the look and behavior of the admin panel.
    |
    | For detailed instructions, you can look at the admin panel classes here:
    |
    */

    'classes_body' => '',

    /*
    |--------------------------------------------------------------------------
    | URLs
    |--------------------------------------------------------------------------
    |
    | Here we can modify the url settings of the admin panel.
    |
    | For detailed instructions, you can look at the urls section here:
    |
    */

    'use_route_url' => true,
    'dashboard_url' => 'admin.index',
    'logout_url' => 'auth.logout',
    'login_url' => 'auth.login',
    'register_url' => false,
    'password_reset_url' => false,
    'password_email_url' => false,
    'profile_url' => false,
    'setting_url' => 'admin.settings',

    /*
    |--------------------------------------------------------------------------
    | Display Alert
    |--------------------------------------------------------------------------
    |
    | Display Alert Visibility.
    |
    */
    'display_alert' => false,

    /*
    |--------------------------------------------------------------------------
    | Menu Items
    |--------------------------------------------------------------------------
    |
    | Here we can modify the sidebar/top navigation of the admin panel.
    |
    | For detailed instructions you can look here:
    |
    */

    'menu' => [
        [
            'text' => 'Overview',
            'icon' => 'ti ti-home',
            'route' => 'admin.index',
        ],
        [
            'text' => 'Settings',
            'icon' => 'ti ti-settings',
            'route' => 'admin.settings',
            'active' => ['admin/settings*'],
        ],
        [
            'text' => 'API',
            'icon' => 'ti ti-plug',
            'route' => 'admin.api.index',
            'active' => ['admin/api*'],
        ],
        [
            'text' => 'Management',
            'icon' => 'ti ti-layout-grid',
            'url' => '#',
            'active' => ['admin/databases*', 'admin/locations*', 'admin/nodes*', 'admin/servers*', 'admin/users*'],
            'submenu' => [
                [
                    'text' => 'Databases',
                    'icon' => 'ti ti-database',
                    'route' => 'admin.databases',
                    'active' => ['admin/databases*'],
                ],
                [
                    'text' => 'Locations',
                    'icon' => 'ti ti-world',
                    'route' => 'admin.locations',
                    'active' => ['admin/locations*'],
                ],
                [
                    'text' => 'Nodes',
                    'icon' => 'ti ti-network',
                    'route' => 'admin.nodes',
                    'active' => ['admin/nodes*'],
                ],
                [
                    'text' => 'Servers',
                    'icon' => 'ti ti-server',
                    'route' => 'admin.servers',
                    'active' => ['admin/servers*'],
                ],
                [
                    'text' => 'Users',
                    'icon' => 'ti ti-users',
                    'route' => 'admin.users',
                    'active' => ['admin/users*'],
                ],
            ],
        ],
        [
            'text' => 'Services',
            'icon' => 'ti ti-puzzle',
            'url' => '#',
            'active' => ['admin/mounts*', 'admin/nests*'],
            'submenu' => [
                [
                    'text' => 'Mounts',
                    'icon' => 'ti ti-folder',
                    'route' => 'admin.mounts',
                    'active' => ['admin/mounts*'],
                ],
                [
                    'text' => 'Nests',
                    'icon' => 'ti ti-egg',
                    'route' => 'admin.nests',
                    'active' => ['admin/nests*'],
                ],
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Menu Filters
    |--------------------------------------------------------------------------
    |
    | Here we can modify the menu filters of the admin panel.
    |
    | For detailed instructions you can look the menu filters section here:
    |
    */

    'filters' => [
        TakiElias\Tablar\Menu\Filters\GateFilter::class,
        TakiElias\Tablar\Menu\Filters\HrefFilter::class,
        TakiElias\Tablar\Menu\Filters\SearchFilter::class,
        TakiElias\Tablar\Menu\Filters\ActiveFilter::class,
        TakiElias\Tablar\Menu\Filters\ClassesFilter::class,
        TakiElias\Tablar\Menu\Filters\LangFilter::class,
        TakiElias\Tablar\Menu\Filters\DataFilter::class,
    ],

    /*
    |--------------------------------------------------------------------------
    | Vite
    |--------------------------------------------------------------------------
    |
    | Here we can enable the Vite support.
    |
    | For detailed instructions you can look the Vite here:
    | https://laravel-vite.dev
    |
    */

    'vite' => false,

    /*
    |--------------------------------------------------------------------------
    | Livewire
    |--------------------------------------------------------------------------
    |
    | Here we can enable the Livewire support.
    |
    | For detailed instructions you can look the livewire here:
    | https://livewire.laravel.com
    |
    */

    'livewire' => false,
];
