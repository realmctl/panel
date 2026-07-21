<?php

namespace Realm\Http\ViewComposers;

use Illuminate\View\View;
use Illuminate\Support\Facades\Cache;
use Realm\Services\Helpers\AssetHashService;
use Realm\Services\Helpers\SoftwareVersionService;
use Realm\Services\Setup\PanelSetupService;
use Realm\Support\Mail\SupportedMailDrivers;

class AssetComposer
{
    /**
     * AssetComposer constructor.
     */
    public function __construct(
        private AssetHashService $assetHashService,
        private PanelSetupService $setupService,
        private SoftwareVersionService $versionService,
    ) {
    }

    /**
     * Provide access to the asset service in the views.
     */
    public function compose(View $view): void
    {
        $provider = config('captcha.provider', 'none');

        $view->with('asset', $this->assetHashService);
        $view->with('siteConfiguration', [
            'name' => config('app.name') ?? 'Realm',
            'locale' => config('app.locale') ?? 'en',
            'recaptcha' => [
                'enabled' => $provider === 'recaptcha',
                'siteKey' => config('captcha.recaptcha.website_key') ?? '',
            ],
            'captcha' => [
                'provider' => $provider,
                'siteKey' => match ($provider) {
                    'recaptcha' => config('captcha.recaptcha.website_key') ?? '',
                    'turnstile' => config('captcha.turnstile.website_key') ?? '',
                    default => '',
                },
            ],
            'oauth' => [
                'google' => (bool) config('oauth.google.enabled', false),
                'discord' => (bool) config('oauth.discord.enabled', false),
                'github' => (bool) config('oauth.github.enabled', false),
            ],
            // Registration also requires a working mail provider, since new accounts
            // must verify their email address before they can log in.
            'registration' => (bool) config('realm.auth.registration_enabled', false) && SupportedMailDrivers::isConfigured(),
            'demoMode' => (bool) config('realm.demo_mode.enabled', false),
            'setup' => $this->setupService->toSiteConfiguration(),
            'version' => [
                'current' => config('app.version'),
                'latest' => $this->versionService->getPanel(),
                'isLatest' => $this->versionService->isLatestPanel(),
                'discord' => $this->versionService->getDiscord(),
                'donations' => $this->versionService->getDonations(),
                'commit' => $this->gitCommitHash(),
            ],
        ]);
    }

    /**
     * Short (8 char) git commit hash for the running checkout, if this is a git clone.
     */
    private function gitCommitHash(): ?string
    {
        return Cache::remember('asset-composer-git-commit', 5, function () {
            if (file_exists(base_path('.git/HEAD'))) {
                $head = explode(' ', file_get_contents(base_path('.git/HEAD')));

                if (array_key_exists(1, $head)) {
                    $path = base_path('.git/' . trim($head[1]));
                }
            }

            if (isset($path) && file_exists($path)) {
                return substr(file_get_contents($path), 0, 8);
            }

            return null;
        });
    }
}
