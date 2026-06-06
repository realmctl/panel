<?php

namespace Pterodactyl\Services\Setup;

use Pterodactyl\Models\Node;
use Pterodactyl\Models\User;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Location;
use Pterodactyl\Models\Allocation;
use Pterodactyl\Traits\Helpers\AvailableLanguages;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;

class PanelSetupService
{
    use AvailableLanguages;

    public const KEY_COMPLETE = 'pterodactyl:setup:completed';

    public const KEY_WINGS_VERIFIED = 'pterodactyl:setup:wings_verified';

    public const KEY_SERVER_SKIPPED = 'pterodactyl:setup:server_skipped';

    public const KEY_SETTINGS_DONE = 'pterodactyl:setup:settings_done';

    public const KEY_WELCOME_DONE = 'pterodactyl:setup:welcome_done';

    public function __construct(private SettingsRepositoryInterface $settings)
    {
    }

    public function isComplete(): bool
    {
        return $this->getBooleanSetting(self::KEY_COMPLETE);
    }

    public function isRequired(): bool
    {
        return !$this->isComplete();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getSteps(): array
    {
        $steps = [
            $this->step('welcome', 'Welcome', 'Get started with your panel', $this->isWelcomeComplete()),
            $this->step('admin', 'Admin account', 'Create your administrator', $this->isAdminComplete(), User::query()->exists()),
            $this->step('settings', 'Panel settings', 'Configure basic panel options', $this->isSettingsComplete()),
            $this->step('location', 'Location', 'Add your first location', $this->isLocationComplete()),
            $this->step('node', 'Node', 'Connect a Wings node', $this->isNodeComplete()),
            $this->step('wings', 'Wings', 'Install and verify Wings', $this->isWingsComplete()),
            $this->step('allocations', 'Allocations', 'Assign IP addresses and ports', $this->isAllocationsComplete()),
            $this->step('server', 'First server', 'Create your first game server', $this->isServerComplete(), false),
            $this->step('finish', 'Finish', 'Setup complete', $this->isComplete()),
        ];

        return array_values(array_filter($steps, fn (array $step) => !$step['skipped']));
    }

    public function getCurrentStepId(): string
    {
        if ($this->isComplete()) {
            return 'finish';
        }

        foreach ($this->getSteps() as $step) {
            if (!$step['complete']) {
                return $step['id'];
            }
        }

        return 'finish';
    }

    /**
     * @return array<string, mixed>
     */
    public function getStatus(): array
    {
        $steps = $this->getSteps();
        $completed = count(array_filter($steps, fn (array $step) => $step['complete']));
        $total = count($steps);

        $node = Node::query()->orderByDesc('id')->first();

        return [
            'required' => $this->isRequired(),
            'complete' => $this->isComplete(),
            'currentStep' => $this->getCurrentStepId(),
            'steps' => $steps,
            'progress' => [
                'completed' => $completed,
                'total' => $total,
                'percent' => $total > 0 ? (int) round(($completed / $total) * 100) : 0,
            ],
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
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function toSiteConfiguration(): array
    {
        try {
            $status = $this->getStatus();
        } catch (\Throwable) {
            return [
                'required' => false,
                'complete' => true,
                'currentStep' => 'finish',
                'steps' => [],
                'progress' => ['completed' => 0, 'total' => 0, 'percent' => 100],
            ];
        }

        return [
            'required' => $status['required'],
            'complete' => $status['complete'],
            'currentStep' => $status['currentStep'],
            'steps' => $status['steps'],
            'progress' => $status['progress'],
        ];
    }

    public function markWelcomeComplete(): void
    {
        $this->settings->set('settings::' . self::KEY_WELCOME_DONE, true);
    }

    public function markSettingsComplete(): void
    {
        $this->settings->set('settings::' . self::KEY_SETTINGS_DONE, true);
    }

    public function markWingsVerified(): void
    {
        $this->settings->set('settings::' . self::KEY_WINGS_VERIFIED, true);
    }

    public function markServerSkipped(): void
    {
        $this->settings->set('settings::' . self::KEY_SERVER_SKIPPED, true);
    }

    public function markComplete(): void
    {
        $this->settings->set('settings::' . self::KEY_COMPLETE, true);
    }

    private function isWelcomeComplete(): bool
    {
        return $this->getBooleanSetting(self::KEY_WELCOME_DONE)
            || User::query()->exists()
            || $this->isSettingsComplete();
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
