<?php

namespace Realm\Services\Schedules;

use InvalidArgumentException;
use Realm\Contracts\Schedules\TaskActionInterface;

class TaskActionRegistry
{
    /** @var array<string, TaskActionInterface> */
    private array $actions = [];

    public function register(TaskActionInterface $action): void
    {
        $this->actions[$action->identifier()] = $action;
    }

    public function get(string $identifier): TaskActionInterface
    {
        if (!isset($this->actions[$identifier])) {
            throw new InvalidArgumentException('Unknown task action: ' . $identifier);
        }

        return $this->actions[$identifier];
    }

    public function has(string $identifier): bool
    {
        return isset($this->actions[$identifier]);
    }

    /**
     * @return array<string, TaskActionInterface>
     */
    public function all(): array
    {
        return $this->actions;
    }

    /**
     * @return string[]
     */
    public function identifiers(): array
    {
        return array_keys($this->actions);
    }

    /**
     * @return array<int, array{identifier: string, label: string, description: string}>
     */
    public function toArray(): array
    {
        return array_values(array_map(
            fn (TaskActionInterface $action) => [
                'identifier' => $action->identifier(),
                'label' => $action->label(),
                'description' => $action->description(),
            ],
            $this->actions
        ));
    }
}
