<?php

namespace Pterodactyl\Http\Controllers\Api\Admin;

use Illuminate\Http\JsonResponse;
use Pterodactyl\Exceptions\Model\DataValidationException;
use Pterodactyl\Exceptions\Repository\RecordNotFoundException;
use Illuminate\Contracts\Console\Kernel;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Traits\Helpers\AvailableLanguages;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;
use Pterodactyl\Http\Requests\Admin\Settings\BaseSettingsFormRequest;

class SettingsController extends Controller
{
    use AvailableLanguages;

    public function __construct(
        private Kernel $kernel,
        private SettingsRepositoryInterface $settings,
    ) {
    }

    public function index(): JsonResponse
    {
        return response()->json([
            'general' => [
                'app:name' => config('app.name'),
                'pterodactyl:auth:2fa_required' => (int) config('pterodactyl.auth.2fa_required'),
                'app:locale' => config('app.locale'),
                'pterodactyl:auth:registration_enabled' => config('pterodactyl.auth.registration_enabled') ? 'true' : 'false',
            ],
            'languages' => $this->getAvailableLanguages(true),
        ]);
    }

    /**
     * @throws DataValidationException
     * @throws RecordNotFoundException
     */
    public function updateGeneral(BaseSettingsFormRequest $request): JsonResponse
    {
        foreach ($request->normalize() as $key => $value) {
            $this->settings->set('settings::' . $key, $value);
        }

        $this->kernel->call('queue:restart');

        return response()->json([
            'success' => true,
            'message' => 'Panel settings have been updated successfully and the queue worker was restarted to apply these changes.',
        ]);
    }
}
