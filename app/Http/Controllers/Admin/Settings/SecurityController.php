<?php

namespace Pterodactyl\Http\Controllers\Admin\Settings;

use Pterodactyl\Exceptions\Model\DataValidationException;
use Pterodactyl\Exceptions\Repository\RecordNotFoundException;
use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;
use Prologue\Alerts\AlertsMessageBag;
use Illuminate\Contracts\Console\Kernel;
use Pterodactyl\Http\Controllers\Controller;
use Illuminate\Contracts\Config\Repository as ConfigRepository;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;
use Pterodactyl\Http\Requests\Admin\Settings\SecuritySettingsFormRequest;

class SecurityController extends Controller
{
    public function __construct(
        private AlertsMessageBag $alert,
        private ConfigRepository $config,
        private Kernel $kernel,
        private SettingsRepositoryInterface $settings,
    ) {
    }

    /**
     * Render security settings page.
     */
    public function index(): View
    {
        $showRecaptchaWarning = false;
        $provider = $this->config->get('captcha.provider', 'none');

        if (
            $provider === 'recaptcha' && (
                $this->config->get('captcha.recaptcha._shipped_secret_key') === $this->config->get('captcha.recaptcha.secret_key')
                || $this->config->get('captcha.recaptcha._shipped_website_key') === $this->config->get('captcha.recaptcha.website_key')
            )
        ) {
            $showRecaptchaWarning = true;
        }

        return view('admin.settings.security', [
            'showRecaptchaWarning' => $showRecaptchaWarning,
        ]);
    }

    /**
     * @throws DataValidationException
     * @throws RecordNotFoundException
     */
    public function update(SecuritySettingsFormRequest $request): RedirectResponse
    {
        foreach ($request->normalize() as $key => $value) {
            $this->settings->set('settings::' . $key, $value);
        }

        $this->kernel->call('queue:restart');
        $this->alert->success('Security settings have been updated successfully.')->flash();

        return redirect()->route('admin.settings.security');
    }
}
