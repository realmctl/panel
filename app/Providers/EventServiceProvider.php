<?php

namespace Realm\Providers;

use Realm\Models\User;
use Realm\Models\Server;
use Realm\Models\Subuser;
use Realm\Models\EggVariable;
use Realm\Observers\UserObserver;
use Realm\Observers\ServerObserver;
use Realm\Observers\SubuserObserver;
use Realm\Listeners\TwoFactorListener;
use Realm\Listeners\RevocationListener;
use Realm\Observers\EggVariableObserver;
use Realm\Listeners\AuthenticationListener;
use Realm\Events\Server\Installed as ServerInstalledEvent;
use Realm\Notifications\ServerInstalled as ServerInstalledNotification;
use SocialiteProviders\Manager\SocialiteWasCalled;
use SocialiteProviders\Discord\DiscordExtendSocialite;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     */
    protected $listen = [
        ServerInstalledEvent::class => [ServerInstalledNotification::class],
        SocialiteWasCalled::class => [
            DiscordExtendSocialite::class . '@handle',
        ],
    ];

    protected $subscribe = [
        AuthenticationListener::class,
        RevocationListener::class,
        TwoFactorListener::class,
    ];

    protected static $shouldDiscoverEvents = false;

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        parent::boot();

        User::observe(UserObserver::class);
        Server::observe(ServerObserver::class);
        Subuser::observe(SubuserObserver::class);
        EggVariable::observe(EggVariableObserver::class);
    }
}
