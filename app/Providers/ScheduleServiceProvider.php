<?php

namespace Pterodactyl\Providers;

use Illuminate\Support\ServiceProvider;
use Pterodactyl\Services\Schedules\Actions\BackupTaskAction;
use Pterodactyl\Services\Schedules\Actions\CommandTaskAction;
use Pterodactyl\Services\Schedules\Actions\DeleteFilesTaskAction;
use Pterodactyl\Services\Schedules\Actions\EmailTaskAction;
use Pterodactyl\Services\Schedules\Actions\PowerTaskAction;
use Pterodactyl\Services\Schedules\Actions\WebhookTaskAction;
use Pterodactyl\Services\Schedules\TaskActionRegistry;

class ScheduleServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(TaskActionRegistry::class, function ($app) {
            $registry = new TaskActionRegistry();

            $registry->register($app->make(PowerTaskAction::class));
            $registry->register($app->make(CommandTaskAction::class));
            $registry->register($app->make(BackupTaskAction::class));
            $registry->register($app->make(WebhookTaskAction::class));
            $registry->register($app->make(EmailTaskAction::class));
            $registry->register($app->make(DeleteFilesTaskAction::class));

            return $registry;
        });
    }
}
