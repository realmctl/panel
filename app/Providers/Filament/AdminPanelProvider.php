<?php

namespace Pterodactyl\Providers\Filament;

use Filament\Panel;
use Filament\PanelProvider;
use Filament\View\PanelsRenderHook;
use Filament\Support\Colors\Color;
use Filament\Http\Middleware\Authenticate;
use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use Illuminate\Support\HtmlString;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Session\Middleware\AuthenticateSession;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;

class AdminPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        return $panel
            ->id('admin')
            ->path('admin')
            ->colors([
                'primary' => Color::Blue,
                'danger' => Color::Red,
                'success' => Color::Green,
                'warning' => Color::Amber,
            ])
            ->brandName('Realm Admin')
            ->theme(asset('css/filament/filament/app.css'))
            ->renderHook(
                PanelsRenderHook::STYLES_AFTER,
                fn (): HtmlString => new HtmlString(sprintf(
                    '<link href="%s" rel="stylesheet" data-realm-filament-theme />',
                    asset('css/filament/filament/app.css') . '?v=' . $this->getFilamentAssetVersion(),
                )),
            )
            ->discoverResources(in: app_path('Filament/Resources'), for: 'Pterodactyl\\Filament\\Resources')
            ->discoverPages(in: app_path('Filament/Pages'), for: 'Pterodactyl\\Filament\\Pages')
            ->discoverWidgets(in: app_path('Filament/Widgets'), for: 'Pterodactyl\\Filament\\Widgets')
            ->middleware([
                EncryptCookies::class,
                AddQueuedCookiesToResponse::class,
                StartSession::class,
                AuthenticateSession::class,
                ShareErrorsFromSession::class,
                VerifyCsrfToken::class,
                SubstituteBindings::class,
                DisableBladeIconComponents::class,
                DispatchServingFilamentEvent::class,
            ])
            ->authMiddleware([
                Authenticate::class,
            ])
            ->authGuard('web')
            ->darkMode(true)
            ->sidebarCollapsibleOnDesktop()
            ->navigationGroups([
                'Server Management',
                'User Management',
                'Infrastructure',
            ]);
    }

    private function getFilamentAssetVersion(): string
    {
        $path = public_path('css/filament/filament/app.css');

        return is_file($path) ? (string) filemtime($path) : (string) time();
    }
}
