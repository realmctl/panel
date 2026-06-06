<?php

return [
    'cache_ttl' => (int) env('GEOLOCATION_CACHE_TTL', 604800),

    'ip_api' => [
        'base_url' => env('GEOLOCATION_IP_API_URL', 'http://ip-api.com/json'),
        'fields' => 'status,message,country,countryCode,city,regionName',
        'timeout' => (int) env('GEOLOCATION_TIMEOUT', 5),
    ],

    'flag_cdn' => [
        'base_url' => env('FLAG_CDN_BASE_URL', 'https://flagcdn.com'),
        'width' => (int) env('FLAG_CDN_WIDTH', 20),
    ],
];
