<?php

namespace Realm\Providers;

use Illuminate\Support\ServiceProvider;
use Realm\Repositories\Eloquent\EggRepository;
use Realm\Repositories\Eloquent\NestRepository;
use Realm\Repositories\Eloquent\NodeRepository;
use Realm\Repositories\Eloquent\TaskRepository;
use Realm\Repositories\Eloquent\UserRepository;
use Realm\Repositories\Eloquent\ApiKeyRepository;
use Realm\Repositories\Eloquent\ServerRepository;
use Realm\Repositories\Eloquent\SessionRepository;
use Realm\Repositories\Eloquent\SubuserRepository;
use Realm\Repositories\Eloquent\DatabaseRepository;
use Realm\Repositories\Eloquent\LocationRepository;
use Realm\Repositories\Eloquent\ScheduleRepository;
use Realm\Repositories\Eloquent\SettingsRepository;
use Realm\Repositories\Eloquent\AllocationRepository;
use Realm\Contracts\Repository\EggRepositoryInterface;
use Realm\Repositories\Eloquent\EggVariableRepository;
use Realm\Contracts\Repository\NestRepositoryInterface;
use Realm\Contracts\Repository\NodeRepositoryInterface;
use Realm\Contracts\Repository\TaskRepositoryInterface;
use Realm\Contracts\Repository\UserRepositoryInterface;
use Realm\Repositories\Eloquent\DatabaseHostRepository;
use Realm\Contracts\Repository\ApiKeyRepositoryInterface;
use Realm\Contracts\Repository\ServerRepositoryInterface;
use Realm\Repositories\Eloquent\ServerVariableRepository;
use Realm\Contracts\Repository\SessionRepositoryInterface;
use Realm\Contracts\Repository\SubuserRepositoryInterface;
use Realm\Contracts\Repository\DatabaseRepositoryInterface;
use Realm\Contracts\Repository\LocationRepositoryInterface;
use Realm\Contracts\Repository\ScheduleRepositoryInterface;
use Realm\Contracts\Repository\SettingsRepositoryInterface;
use Realm\Contracts\Repository\AllocationRepositoryInterface;
use Realm\Contracts\Repository\EggVariableRepositoryInterface;
use Realm\Contracts\Repository\DatabaseHostRepositoryInterface;
use Realm\Contracts\Repository\ServerVariableRepositoryInterface;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register all the repository bindings.
     */
    public function register(): void
    {
        // Eloquent Repositories
        $this->app->bind(AllocationRepositoryInterface::class, AllocationRepository::class);
        $this->app->bind(ApiKeyRepositoryInterface::class, ApiKeyRepository::class);
        $this->app->bind(DatabaseRepositoryInterface::class, DatabaseRepository::class);
        $this->app->bind(DatabaseHostRepositoryInterface::class, DatabaseHostRepository::class);
        $this->app->bind(EggRepositoryInterface::class, EggRepository::class);
        $this->app->bind(EggVariableRepositoryInterface::class, EggVariableRepository::class);
        $this->app->bind(LocationRepositoryInterface::class, LocationRepository::class);
        $this->app->bind(NestRepositoryInterface::class, NestRepository::class);
        $this->app->bind(NodeRepositoryInterface::class, NodeRepository::class);
        $this->app->bind(ScheduleRepositoryInterface::class, ScheduleRepository::class);
        $this->app->bind(ServerRepositoryInterface::class, ServerRepository::class);
        $this->app->bind(ServerVariableRepositoryInterface::class, ServerVariableRepository::class);
        $this->app->bind(SessionRepositoryInterface::class, SessionRepository::class);
        $this->app->bind(SettingsRepositoryInterface::class, SettingsRepository::class);
        $this->app->bind(SubuserRepositoryInterface::class, SubuserRepository::class);
        $this->app->bind(TaskRepositoryInterface::class, TaskRepository::class);
        $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
    }
}
