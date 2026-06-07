<?php

namespace Pterodactyl\Http\Controllers\Api\Admin;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Exceptions\Model\DataValidationException;
use Pterodactyl\Exceptions\Repository\RecordNotFoundException;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Contracts\Encryption\Encrypter;
use Illuminate\Contracts\Config\Repository as ConfigRepository;
use Pterodactyl\Http\Controllers\Admin\Settings\MailController;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Models\Nest;
use Pterodactyl\Notifications\MailTested;
use Pterodactyl\Providers\SettingsServiceProvider;
use Pterodactyl\Services\Eggs\EggCategoryMappingService;
use Pterodactyl\Traits\Helpers\AvailableLanguages;
use Illuminate\Support\Facades\Notification;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;
use Pterodactyl\Http\Requests\Admin\Settings\AdvancedSettingsFormRequest;
use Pterodactyl\Http\Requests\Admin\Settings\BaseSettingsFormRequest;
use Pterodactyl\Http\Requests\Admin\Settings\EggMappingsFormRequest;
use Pterodactyl\Http\Requests\Admin\Settings\MailSettingsFormRequest;
use Pterodactyl\Http\Requests\Admin\Settings\OAuthSettingsFormRequest;
use Pterodactyl\Http\Requests\Admin\Settings\SecuritySettingsFormRequest;

class SettingsController extends Controller
{
    use AvailableLanguages;

    public function __construct(
        private Kernel $kernel,
        private SettingsRepositoryInterface $settings,
        private ConfigRepository $config,
        private Encrypter $encrypter,
        private EggCategoryMappingService $mappingService,
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

    public function mail(): JsonResponse
    {
        $driver = $this->config->get('mail.default');

        return response()->json([
            'disabled' => !in_array($driver, MailController::SUPPORTED_DRIVERS, true),
            'driver' => $driver,
            'providers' => MailController::SUPPORTED_DRIVERS,
            'settings' => [
                'mail:default' => $driver,
                'mail:from:address' => $this->config->get('mail.from.address'),
                'mail:from:name' => $this->config->get('mail.from.name'),
                'mail:mailers:smtp:host' => $this->config->get('mail.mailers.smtp.host'),
                'mail:mailers:smtp:port' => $this->config->get('mail.mailers.smtp.port'),
                'mail:mailers:smtp:encryption' => $this->config->get('mail.mailers.smtp.encryption') ?? '',
                'mail:mailers:smtp:username' => $this->config->get('mail.mailers.smtp.username'),
                'services:mailgun:domain' => $this->config->get('services.mailgun.domain'),
                'services:mailgun:endpoint' => $this->config->get('services.mailgun.endpoint', 'api.mailgun.net'),
            ],
        ]);
    }

    /**
     * @throws DataValidationException
     * @throws RecordNotFoundException
     */
    public function updateMail(MailSettingsFormRequest $request): JsonResponse
    {
        $values = $request->normalize();

        if (array_get($values, 'mail:mailers:smtp:password') === '!e') {
            $values['mail:mailers:smtp:password'] = '';
        }

        foreach ($values as $key => $value) {
            if (in_array($key, SettingsServiceProvider::getEncryptedKeys(), true) && !empty($value)) {
                $value = $this->encrypter->encrypt($value);
            }

            $this->settings->set('settings::' . $key, $value);
        }

        $this->kernel->call('queue:restart');

        return response()->json([
            'success' => true,
            'message' => 'Mail settings have been updated successfully and the queue worker was restarted to apply these changes.',
        ]);
    }

    public function testMail(Request $request): JsonResponse
    {
        try {
            Notification::route('mail', $request->user()->email)
                ->notify(new MailTested($request->user()));
        } catch (Exception $exception) {
            return response()->json(['message' => $exception->getMessage()], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'The test message was sent successfully.',
        ]);
    }

    public function security(): JsonResponse
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

        return response()->json([
            'showRecaptchaWarning' => $showRecaptchaWarning,
            'settings' => [
                'captcha:provider' => $provider,
                'captcha:recaptcha:website_key' => $this->config->get('captcha.recaptcha.website_key'),
                'captcha:recaptcha:secret_key' => $this->config->get('captcha.recaptcha.secret_key'),
                'captcha:turnstile:website_key' => $this->config->get('captcha.turnstile.website_key'),
                'captcha:turnstile:secret_key' => $this->config->get('captcha.turnstile.secret_key'),
                'pterodactyl:guzzle:connect_timeout' => (int) $this->config->get('pterodactyl.guzzle.connect_timeout'),
                'pterodactyl:guzzle:timeout' => (int) $this->config->get('pterodactyl.guzzle.timeout'),
            ],
        ]);
    }

    /**
     * @throws DataValidationException
     * @throws RecordNotFoundException
     */
    public function updateSecurity(SecuritySettingsFormRequest $request): JsonResponse
    {
        foreach ($request->normalize() as $key => $value) {
            $this->settings->set('settings::' . $key, $value);
        }

        $this->kernel->call('queue:restart');

        return response()->json([
            'success' => true,
            'message' => 'Security settings have been updated successfully.',
        ]);
    }

    public function oauth(): JsonResponse
    {
        return response()->json([
            'settings' => [
                'oauth:google:enabled' => config('oauth.google.enabled') ? 'true' : 'false',
                'oauth:google:client_id' => config('oauth.google.client_id'),
                'oauth:google:client_secret' => config('oauth.google.client_secret'),
                'oauth:discord:enabled' => config('oauth.discord.enabled') ? 'true' : 'false',
                'oauth:discord:client_id' => config('oauth.discord.client_id'),
                'oauth:discord:client_secret' => config('oauth.discord.client_secret'),
                'oauth:github:enabled' => config('oauth.github.enabled') ? 'true' : 'false',
                'oauth:github:client_id' => config('oauth.github.client_id'),
                'oauth:github:client_secret' => config('oauth.github.client_secret'),
            ],
            'callbackUrls' => [
                'google' => url('/auth/oauth/google/callback'),
                'discord' => url('/auth/oauth/discord/callback'),
                'github' => url('/auth/oauth/github/callback'),
            ],
        ]);
    }

    /**
     * @throws DataValidationException
     * @throws RecordNotFoundException
     */
    public function updateOAuth(OAuthSettingsFormRequest $request): JsonResponse
    {
        foreach ($request->normalize() as $key => $value) {
            $this->settings->set('settings::' . $key, $value);
        }

        $this->kernel->call('queue:restart');

        return response()->json([
            'success' => true,
            'message' => 'OAuth settings have been updated successfully.',
        ]);
    }

    public function mappings(): JsonResponse
    {
        return response()->json([
            'categories' => $this->mappingService->getCategoryDefinitions()->all(),
            'mappings' => $this->mappingService->getMappingsGroupedByCategory(),
            'nests' => Nest::query()
                ->with('eggs')
                ->orderBy('name')
                ->get()
                ->map(fn (Nest $nest) => [
                    'id' => $nest->id,
                    'name' => $nest->name,
                    'eggs' => $nest->eggs
                        ->sortBy('name')
                        ->values()
                        ->map(fn ($egg) => ['id' => $egg->id, 'name' => $egg->name])
                        ->all(),
                ])
                ->filter(fn (array $nest) => count($nest['eggs']) > 0)
                ->values()
                ->all(),
        ]);
    }

    public function updateMappings(EggMappingsFormRequest $request): JsonResponse
    {
        try {
            $this->mappingService->syncMappings($request->input('mappings', []));
        } catch (DisplayException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Egg mappings have been updated successfully.',
        ]);
    }

    public function advanced(): JsonResponse
    {
        return response()->json([
            'settings' => [
                'pterodactyl:client_features:allocations:enabled' => config('pterodactyl.client_features.allocations.enabled') ? 'true' : 'false',
                'pterodactyl:client_features:allocations:range_start' => config('pterodactyl.client_features.allocations.range_start'),
                'pterodactyl:client_features:allocations:range_end' => config('pterodactyl.client_features.allocations.range_end'),
            ],
        ]);
    }

    /**
     * @throws DataValidationException
     * @throws RecordNotFoundException
     */
    public function updateAdvanced(AdvancedSettingsFormRequest $request): JsonResponse
    {
        foreach ($request->normalize() as $key => $value) {
            $this->settings->set('settings::' . $key, $value);
        }

        $this->kernel->call('queue:restart');

        return response()->json([
            'success' => true,
            'message' => 'Advanced settings have been updated successfully.',
        ]);
    }
}
