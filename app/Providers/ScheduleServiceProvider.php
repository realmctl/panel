<?php

namespace Realm\Providers;

use Illuminate\Support\ServiceProvider;
use Realm\Services\Schedules\Actions\BackupTaskAction;
use Realm\Services\Schedules\Actions\CommandTaskAction;
use Realm\Services\Schedules\Actions\DeleteFilesTaskAction;
use Realm\Services\Schedules\Actions\EmailTaskAction;
use Realm\Services\Schedules\Actions\PowerTaskAction;
use Realm\Services\Schedules\Actions\WebhookTaskAction;
use Realm\Services\Schedules\TaskActionRegistry;

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
