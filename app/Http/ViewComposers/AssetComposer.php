<?php

namespace Pterodactyl\Http\ViewComposers;

use Illuminate\View\View;
use Pterodactyl\Services\Helpers\AssetHashService;

class AssetComposer
{
    /**
     * AssetComposer constructor.
     */
    public function __construct(private AssetHashService $assetHashService)
    {
    }

    /**
     * Provide access to the asset service in the views.
     */
    public function compose(View $view): void
    {
        $provider = config('captcha.provider', 'none');

        $view->with('asset', $this->assetHashService);
        $view->with('siteConfiguration', [
            'name' => config('app.name') ?? 'Pterodactyl',
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
        ]);
    }
}
