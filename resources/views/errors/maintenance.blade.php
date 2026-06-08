<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>{{ config('app.name', 'Realm') }} — Maintenance</title>
    </head>
    <body style="margin: 0; font-family: system-ui, sans-serif; background: #0b0f10; color: #e5e5e5;">
        <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem;">
            <div style="max-width: 32rem; text-align: center;">
                <h1 style="margin: 0 0 1rem; font-size: 1.5rem;">Maintenance mode</h1>
                <p style="margin: 0; color: #a3a3a3;">
                    {{ config('app.name', 'Realm') }} is temporarily unavailable while maintenance is in progress.
                </p>
            </div>
        </div>
    </body>
</html>
