<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Egg Category Registry
    |--------------------------------------------------------------------------
    |
    | Defines the categories admins can assign eggs to in Settings → Mappings.
    | Used to enable category-specific features (player manager, plugins, etc.).
    |
    */
    'categories' => [
        'minecraft' => [
            'label' => 'Minecraft',
            'description' => 'Java Edition Minecraft servers such as Paper, Vanilla, Forge, Fabric, and Sponge.',
            'icon' => 'ti-brand-minecraft',
            'features' => ['players', 'plugins', 'versions'],
        ],
    ],
];
