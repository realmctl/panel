<?php

namespace Pterodactyl\Http\Controllers\Admin\Servers;

use Throwable;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Allocation;
use Illuminate\Http\RedirectResponse;
use Prologue\Alerts\AlertsMessageBag;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Services\Servers\ServerCreationService;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;
use Pterodactyl\Exceptions\Service\Deployment\NoViableAllocationException;

class DuplicateServerController extends Controller
{
    public function __construct(
        private AlertsMessageBag $alert,
        private ServerCreationService $creationService,
    ) {
    }

    /**
     * Duplicate an existing server. Copies all settings and variables to a new server
     * on the same node. A free allocation on that node is required.
     *
     * @throws Throwable
     */
    public function store(Server $server): RedirectResponse
    {
        $allocation = Allocation::query()
            ->where('node_id', $server->node_id)
            ->whereNull('server_id')
            ->first();

        if (!$allocation) {
            $this->alert->danger('No free allocations are available on this server\'s node. Add an allocation before duplicating.')->flash();

            return new RedirectResponse('/admin/servers/view/' . $server->id);
        }

        // Build environment from the source server's current variable values.
        $environment = [];
        foreach ($server->variables as $variable) {
            $environment[$variable->env_variable] = $variable->server_value ?? $variable->default_value ?? '';
        }

        try {
            $newServer = $this->creationService->handle([
                'name' => $server->name . ' (Copy)',
                'description' => $server->description,
                'owner_id' => $server->owner_id,
                'node_id' => $server->node_id,
                'allocation_id' => $allocation->id,
                'nest_id' => $server->nest_id,
                'egg_id' => $server->egg_id,
                'startup' => $server->startup,
                'image' => $server->image,
                'memory' => $server->memory,
                'swap' => $server->swap,
                'disk' => $server->disk,
                'io' => $server->io,
                'cpu' => $server->cpu,
                'threads' => $server->threads,
                'oom_disabled' => $server->oom_disabled,
                'database_limit' => $server->database_limit,
                'allocation_limit' => $server->allocation_limit,
                'backup_limit' => $server->backup_limit,
                'skip_scripts' => false,
                'environment' => $environment,
            ]);
        } catch (DaemonConnectionException $e) {
            $this->alert->danger('Server was created but the daemon could not be reached: ' . $e->getMessage())->flash();

            return new RedirectResponse('/admin/servers');
        }

        $this->alert->success('Server duplicated successfully. The copy is now installing.')->flash();

        return new RedirectResponse('/admin/servers/view/' . $newServer->id);
    }
}
