<?php

namespace Pterodactyl\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Contracts\Config\Repository as ConfigRepository;

class OAuthServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap OAuth services.
     *
     * Syncs oauth.* config values into services.* so that Socialite
     * picks up credentials configured via the admin panel.
     */
    public function boot(ConfigRepository $config): void
    {
        $providers = ['google', 'discord', 'github'];

        foreach ($providers as $provider) {
            $clientId = $config->get("oauth.{$provider}.client_id");
            $clientSecret = $config->get("oauth.{$provider}.client_secret");

            if ($clientId) {
                $config->set("services.{$provider}.client_id", $clientId);
            }
            if ($clientSecret) {
                $config->set("services.{$provider}.client_secret", $clientSecret);
            }
        }
    }
}
