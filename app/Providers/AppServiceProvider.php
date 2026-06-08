<?php

namespace Realm\Providers;

use Realm\Models\Allocation;
use Realm\Models\ApiKey;
use Realm\Models\Backup;
use Realm\Models\Database;
use Realm\Models\Egg;
use Realm\Models\EggVariable;
use Realm\Models\Schedule;
use Realm\Models\Server;
use Realm\Models\UserSSHKey;
use Realm\Models\Task;
use Realm\Models\User;
use Realm\Models\Subdomain\Subdomain;
use Realm\Models;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\URL;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use Illuminate\Database\Eloquent\Relations\Relation;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Schema::defaultStringLength(191);

        View::share('appVersion', $this->versionData()['version'] ?? 'undefined');
        View::share('appIsGit', $this->versionData()['is_git'] ?? false);

        Paginator::useBootstrap();

        // If the APP_URL value is set with https:// make sure we force it here. Theoretically
        // this should just work with the proxy logic, but there are a lot of cases where it
        // doesn't, and it triggers a lot of support requests, so lets just head it off here.
        //
        // @see https://github.com/realmctl/panel/issues/3623
        if (Str::startsWith(config('app.url') ?? '', 'https://')) {
            URL::forceScheme('https');
        }

        Relation::enforceMorphMap([
            'allocation' => Allocation::class,
            'api_key' => ApiKey::class,
            'backup' => Backup::class,
            'database' => Database::class,
            'egg' => Egg::class,
            'egg_variable' => EggVariable::class,
            'schedule' => Schedule::class,
            'subdomain' => Subdomain::class,
            'server' => Server::class,
            'ssh_key' => UserSSHKey::class,
            'task' => Task::class,
            'user' => User::class,
        ]);
    }

    /**
     * Register application service providers.
     */
    public function register(): void
    {
        // Only load the settings service provider if the environment
        // is configured to allow it.
        if (!config('realm.load_environment_only', false) && $this->app->environment() !== 'testing') {
            $this->app->register(SettingsServiceProvider::class);
            $this->app->register(OAuthServiceProvider::class);
        }

        // Bind the setup service as a singleton so the per-request setup summary is
        // only computed once even though the asset view composer runs for every view.
        $this->app->singleton(\Realm\Services\Setup\PanelSetupService::class);
    }

    /**
     * Return version information for the footer.
     */
    protected function versionData(): array
    {
        return Cache::remember('git-version', 5, function () {
            if (file_exists(base_path('.git/HEAD'))) {
                $head = explode(' ', file_get_contents(base_path('.git/HEAD')));

                if (array_key_exists(1, $head)) {
                    $path = base_path('.git/' . trim($head[1]));
                }
            }

            if (isset($path) && file_exists($path)) {
                return [
                    'version' => substr(file_get_contents($path), 0, 8),
                    'is_git' => true,
                ];
            }

            return [
                'version' => config('app.version'),
                'is_git' => false,
            ];
        });
    }
}
