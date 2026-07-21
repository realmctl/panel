<?php

namespace Realm\Console\Commands\Demo;

use Throwable;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Database\Seeders\DemoSeeder;
use Realm\Models\ActivityLog;
use Realm\Models\Allocation;
use Realm\Models\ApiKey;
use Realm\Models\Backup;
use Realm\Models\Database;
use Realm\Models\Schedule;
use Realm\Models\ScheduleRun;
use Realm\Models\ScheduleRunTask;
use Realm\Models\Server;
use Realm\Models\ServerTransfer;
use Realm\Models\ServerVariable;
use Realm\Models\Subdomain\Record;
use Realm\Models\Subuser;
use Realm\Models\SubuserPermissionTemplate;
use Realm\Models\Task;
use Realm\Models\TaskLog;
use Realm\Models\User;
use Realm\Models\UserSSHKey;
use Realm\Repositories\Wings\DaemonServerRepository;
use Realm\Exceptions\Http\Connection\DaemonConnectionException;

class DemoResetCommand extends Command
{
    protected $signature = 'p:demo:reset';

    protected $description = 'Wipes all demo content (users, servers, and related data) and reseeds a fresh admin account and demo server. Only runs when demo mode is enabled.';

    public function __construct(private DaemonServerRepository $daemonServerRepository)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        if (!config('realm.demo_mode.enabled')) {
            $this->warn('Demo mode is not enabled (REALM_DEMO_MODE=false), skipping reset.');

            return self::SUCCESS;
        }

        $this->info('Starting demo reset...');

        $this->wipeDaemonServers();
        $this->wipePanelData();

        try {
            app(DemoSeeder::class)->run();
        } catch (Throwable $exception) {
            Log::error('Demo reset: failed to reseed panel data.', ['exception' => $exception]);
            $this->error('Failed to reseed demo data: ' . $exception->getMessage());

            return self::FAILURE;
        }

        $this->info('Demo reset complete.');

        return self::SUCCESS;
    }

    /**
     * Tell Wings to tear down every existing server's container and volume before
     * the panel-side records are wiped. Failures here are logged but don't stop
     * the reset — an unreachable node shouldn't leave the demo panel stuck.
     */
    private function wipeDaemonServers(): void
    {
        Server::query()->with('node')->each(function (Server $server) {
            try {
                $this->daemonServerRepository->setServer($server)->delete();
            } catch (DaemonConnectionException $exception) {
                Log::warning('Demo reset: failed to delete server on daemon, continuing anyway.', [
                    'server' => $server->uuid,
                    'exception' => $exception,
                ]);
            }
        });
    }

    /**
     * Truncate every table that can contain demo-user-generated content. Nodes,
     * locations, nests, eggs, and egg variables are intentionally left alone —
     * they're provisioned once as static infrastructure, not per-reset.
     */
    private function wipePanelData(): void
    {
        Schema::disableForeignKeyConstraints();

        foreach ([
            ActivityLog::class,
            ApiKey::class,
            Backup::class,
            Database::class,
            Record::class,
            ScheduleRunTask::class,
            ScheduleRun::class,
            Schedule::class,
            ServerTransfer::class,
            ServerVariable::class,
            SubuserPermissionTemplate::class,
            Subuser::class,
            TaskLog::class,
            Task::class,
            Server::class,
            UserSSHKey::class,
            User::class,
        ] as $model) {
            $model::query()->truncate();
        }

        // Allocations belong to the node, not to the demo content — release them
        // instead of deleting so the node's port pool stays intact.
        Allocation::query()->update(['server_id' => null]);

        DB::table('sessions')->truncate();
        DB::table('password_reset_tokens')->truncate();

        Schema::enableForeignKeyConstraints();
    }
}
