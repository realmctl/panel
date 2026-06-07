<?php

namespace Realm\Providers;

use Illuminate\Support\ServiceProvider;
use Realm\Http\ViewComposers\AssetComposer;

class ViewComposerServiceProvider extends ServiceProvider
{
    /**
     * Register bindings in the container.
     */
    public function boot(): void
    {
        $this->app->make('view')->composer('*', AssetComposer::class);
    }
}
