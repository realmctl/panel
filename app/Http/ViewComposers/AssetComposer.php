<?php

namespace Realm\Http\ViewComposers;

use Illuminate\View\View;
use Realm\Services\Helpers\AssetHashService;
use Realm\Services\Helpers\SoftwareVersionService;
use Realm\Services\Setup\PanelSetupService;

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
            'registration' => (bool) config('realm.auth.registration_enabled', false),
            'setup' => $this->setupService->toSiteConfiguration(),
            'version' => [
                'current' => config('app.version'),
                'latest' => $this->versionService->getPanel(),
                'isLatest' => $this->versionService->isLatestPanel(),
                'discord' => $this->versionService->getDiscord(),
                'donations' => $this->versionService->getDonations(),
            ],
        ]);
    }
}
