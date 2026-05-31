<?php

namespace Pterodactyl\Http\Controllers\Admin\Settings;

use Pterodactyl\Exceptions\Model\DataValidationException;
use Pterodactyl\Exceptions\Repository\RecordNotFoundException;
use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;
use Prologue\Alerts\AlertsMessageBag;
use Illuminate\Contracts\Console\Kernel;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;
use Pterodactyl\Http\Requests\Admin\Settings\OAuthSettingsFormRequest;

class OAuthController extends Controller
{
    public function __construct(
        private AlertsMessageBag $alert,
        private Kernel $kernel,
        private SettingsRepositoryInterface $settings,
    ) {
    }

    /**
     * Render the OAuth settings page.
     */
    public function index(): View
    {
        return view('admin.settings.oauth');
    }

    /**
     * Update OAuth settings.
     *
     * @throws DataValidationException
     * @throws RecordNotFoundException
     */
    public function update(OAuthSettingsFormRequest $request): RedirectResponse
    {
        foreach ($request->normalize() as $key => $value) {
            $this->settings->set('settings::' . $key, $value);
        }

        $this->kernel->call('queue:restart');
        $this->alert->success('OAuth settings have been updated successfully.')->flash();

        return redirect()->route('admin.settings.oauth');
    }
}
