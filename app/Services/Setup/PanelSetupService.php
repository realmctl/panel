<?php

namespace Realm\Services\Setup;

use Realm\Models\Node;
use Realm\Models\User;
use Realm\Models\Server;
use Realm\Models\Location;
use Realm\Models\Allocation;
use Realm\Traits\Helpers\AvailableLanguages;
use Realm\Contracts\Repository\SettingsRepositoryInterface;

class PanelSetupService
{
    use AvailableLanguages;

    public const KEY_COMPLETE = 'realm:setup:completed';

    public const KEY_WINGS_VERIFIED = 'realm:setup:wings_verified';

    public const KEY_SERVER_SKIPPED = 'realm:setup:server_skipped';

    public const KEY_SETTINGS_DONE = 'realm:setup:settings_done';

    public const KEY_WELCOME_DONE = 'realm:setup:welcome_done';

    public const KEY_ENVIRONMENT_DONE = SetupEnvironmentService::KEY_ENVIRONMENT_DONE;

    public const KEY_LOCATION_DONE = 'realm:setup:location_done';

    public const KEY_FORCE_REOPEN = 'realm:setup:force_reopen';

    /**
     * @var array<int, string>
     */
    private const SETUP_SETTING_KEYS = [
        self::KEY_COMPLETE,
        self::KEY_WINGS_VERIFIED,
        self::KEY_SERVER_SKIPPED,
        self::KEY_SETTINGS_DONE,
        self::KEY_WELCOME_DONE,
        self::KEY_ENVIRONMENT_DONE,
        self::KEY_LOCATION_DONE,
        self::KEY_FORCE_REOPEN,
    ];

    /**
     * @var array<string, mixed>|null
     */
    private ?array $summaryCache = null;

    public function __construct(
        private SettingsRepositoryInterface $settings,
        private SetupEnvironmentService $environmentService,
    ) {
    }

    public function isComplete(): bool
    {
        if ($this->isTestingMode()) {
            return false;
        }

        if ($this->getBooleanSetting(self::KEY_COMPLETE)) {
            return true;
        }

        // Installations created before the setup wizard existed should not be forced
        // through it. If the wizard was never started but the panel already has an
        // administrator, treat setup as effectively complete.
        if (!$this->wizardStarted() && User::query()->where('root_admin', true)->exists()) {
            return true;
        }

        return false;
    }

    public function isTestingMode(): bool
    {
        return $this->getBooleanSetting(self::KEY_FORCE_REOPEN);
    }

    public function resetForTesting(): void
    {
        foreach (self::SETUP_SETTING_KEYS as $key) {
            $this->settings->forget('settings::' . $key);
        }

        $this->settings->set('settings::' . self::KEY_FORCE_REOPEN, true);
        $this->summaryCache = null;
    }

    public function restoreAfterTesting(): void
    {
        $this->settings->forget('settings::' . self::KEY_FORCE_REOPEN);
        $this->settings->set('settings::' . self::KEY_COMPLETE, true);
        $this->summaryCache = null;
    }

    public function isRequired(): bool
    {
        return !$this->isComplete();
    }

    private function wizardStarted(): bool
    {
        if ($this->isTestingMode()) {
            return true;
        }

        return $this->getBooleanSetting(self::KEY_WELCOME_DONE)
            || $this->getBooleanSetting(self::KEY_ENVIRONMENT_DONE)
            || $this->getBooleanSetting(self::KEY_SETTINGS_DONE)
            || $this->getBooleanSetting(self::KEY_WINGS_VERIFIED)
            || $this->getBooleanSetting(self::KEY_SERVER_SKIPPED);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getSteps(): array
    {
        $steps = [
            $this->step('welcome', 'Welcome', 'Get started with your panel', $this->isWelcomeComplete()),
            $this->step('environment', 'Environment', 'Configure application URL and drivers', $this->isEnvironmentComplete()),
            $this->step('admin', 'Admin account', 'Create your administrator', $this->isAdminComplete(), User::query()->exists()),
            $this->step('settings', 'Panel settings', 'Configure basic panel options', $this->isSettingsComplete()),
            $this->step('location', 'Location', 'Add your first location', $this->isLocationComplete()),
            $this->step('node', 'Node', 'Connect a Wings node', $this->isNodeComplete(), true),
            $this->step('wings', 'Wings', 'Install and verify Wings', $this->isWingsComplete(), true),
            $this->step('allocations', 'Allocations', 'Assign IP addresses and ports', $this->isAllocationsComplete(), true),
            $this->step('server', 'First server', 'Create your first game server', $this->isServerComplete(), true),
            $this->step('finish', 'Finish', 'Setup complete', $this->isComplete()),
        ];

        return array_values(array_filter($steps, fn (array $step) => !$step['skipped']));
    }

    public function getCurrentStepId(): string
    {
        return $this->resolveCurrentStepId($this->getSteps(), $this->isComplete());
    }

    /**
     * @param array<int, array<string, mixed>> $steps
     */
    private function resolveCurrentStepId(array $steps, bool $complete): string
    {
        if ($complete) {
            return 'finish';
        }

        foreach ($steps as $step) {
            if (!$step['complete']) {
                return $step['id'];
            }
        }

        return 'finish';
    }

    /**
     * Returns the lightweight setup summary (steps + progress) without the more
     * expensive context payload. Safe to call on every request.
     *
     * @return array<string, mixed>
     */
    public function getSummary(): array
    {
        $steps = $this->getSteps();
        $complete = $this->isComplete();
        $completed = count(array_filter($steps, fn (array $step) => $step['complete']));
        $total = count($steps);

        return [
            'required' => !$complete,
            'complete' => $complete,
            'currentStep' => $this->resolveCurrentStepId($steps, $complete),
            'steps' => $steps,
            'progress' => [
                'completed' => $completed,
                'total' => $total,
                'percent' => $total > 0 ? (int) round(($completed / $total) * 100) : 0,
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function getStatus(): array
    {
        $node = Node::query()->orderByDesc('id')->first();

        return array_merge($this->getSummary(), [
            'context' => [
                'hasUsers' => User::query()->exists(),
                'locationId' => Location::query()->value('id'),
                'nodeId' => $node?->id,
                'nodeName' => $node?->name,
                'allocationCount' => $node ? Allocation::query()->where('node_id', $node->id)->count() : 0,
                'serverCount' => Server::query()->count(),
                'locales' => $this->getAvailableLanguages(true),
                'panelName' => config('app.name'),
                'panelLocale' => config('app.locale'),
                'environment' => $this->environmentService->getDefaults(request()),
                'testingMode' => $this->isTestingMode(),
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function toSiteConfiguration(): array
    {
        if ($this->summaryCache !== null) {
            return $this->summaryCache;
        }

        try {
            return $this->summaryCache = $this->getSummary();
        } catch (\Throwable) {
            return [
                'required' => false,
                'complete' => true,
                'currentStep' => 'finish',
                'steps' => [],
                'progress' => ['completed' => 0, 'total' => 0, 'percent' => 100],
            ];
        }
    }

    public function markWelcomeComplete(): void
    {
        $this->settings->set('settings::' . self::KEY_WELCOME_DONE, true);
        $this->summaryCache = null;
    }

    public function markEnvironmentComplete(): void
    {
        $this->settings->set('settings::' . self::KEY_ENVIRONMENT_DONE, true);
        $this->summaryCache = null;
    }

    public function markSettingsComplete(): void
    {
        $this->settings->set('settings::' . self::KEY_SETTINGS_DONE, true);
        $this->summaryCache = null;
    }

    public function markWingsVerified(): void
    {
        $this->settings->set('settings::' . self::KEY_WINGS_VERIFIED, true);
        $this->summaryCache = null;
    }

    public function markServerSkipped(): void
    {
        $this->settings->set('settings::' . self::KEY_SERVER_SKIPPED, true);
        $this->summaryCache = null;
    }

    public function markLocationComplete(): void
    {
        $this->settings->set('settings::' . self::KEY_LOCATION_DONE, true);
        $this->summaryCache = null;
    }

    public function markComplete(): void
    {
        $this->settings->forget('settings::' . self::KEY_FORCE_REOPEN);
        $this->settings->set('settings::' . self::KEY_COMPLETE, true);
        $this->summaryCache = null;
    }

    private function isWelcomeComplete(): bool
    {
        if ($this->isTestingMode()) {
            return $this->getBooleanSetting(self::KEY_WELCOME_DONE);
        }

        return $this->getBooleanSetting(self::KEY_WELCOME_DONE)
            || $this->isEnvironmentComplete()
            || User::query()->exists()
            || $this->isSettingsComplete();
    }

    private function isEnvironmentComplete(): bool
    {
        if ($this->isTestingMode()) {
            return $this->getBooleanSetting(self::KEY_ENVIRONMENT_DONE);
        }

        return $this->getBooleanSetting(self::KEY_ENVIRONMENT_DONE)
            || $this->environmentService->isConfigured();
    }

    private function isAdminComplete(): bool
    {
        return User::query()->exists();
    }

    private function isSettingsComplete(): bool
    {
        return $this->getBooleanSetting(self::KEY_SETTINGS_DONE);
    }

    private function isLocationComplete(): bool
    {
        if ($this->isTestingMode()) {
            return $this->getBooleanSetting(self::KEY_LOCATION_DONE);
        }

        return Location::query()->exists();
    }

    private function isNodeComplete(): bool
    {
        return Node::query()->exists();
    }

    private function isWingsComplete(): bool
    {
        return $this->getBooleanSetting(self::KEY_WINGS_VERIFIED);
    }

    private function isAllocationsComplete(): bool
    {
        return Allocation::query()->exists();
    }

    private function isServerComplete(): bool
    {
        return $this->getBooleanSetting(self::KEY_SERVER_SKIPPED) || Server::query()->exists();
    }

    private function getBooleanSetting(string $key): bool
    {
        try {
            $value = $this->settings->get('settings::' . $key, false);
        } catch (\Throwable) {
            return false;
        }

        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }

    /**
     * @return array<string, mixed>
     */
    private function step(string $id, string $label, string $description, bool $complete, bool $skipped = false): array
    {
        return [
            'id' => $id,
            'label' => $label,
            'description' => $description,
            'complete' => $complete,
            'skipped' => $skipped,
        ];
    }
}
