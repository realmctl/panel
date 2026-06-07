<?php

namespace Pterodactyl\Http\Controllers\Api\Admin;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use PDOException;
use Pterodactyl\Exceptions\Model\DataValidationException;
use Pterodactyl\Exceptions\Repository\RecordNotFoundException;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Http\Requests\Admin\DatabaseHostFormRequest;
use Pterodactyl\Models\DatabaseHost;
use Pterodactyl\Services\Databases\Hosts\HostCreationService;
use Pterodactyl\Services\Databases\Hosts\HostDeletionService;
use Pterodactyl\Services\Databases\Hosts\HostUpdateService;
use Pterodactyl\Contracts\Repository\DatabaseRepositoryInterface;
use Pterodactyl\Contracts\Repository\LocationRepositoryInterface;
use Pterodactyl\Contracts\Repository\DatabaseHostRepositoryInterface;
use Throwable;

class DatabaseHostController extends Controller
{
    public function __construct(
        private DatabaseHostRepositoryInterface $repository,
        private DatabaseRepositoryInterface $databaseRepository,
        private LocationRepositoryInterface $locationRepository,
        private HostCreationService $creationService,
        private HostUpdateService $updateService,
        private HostDeletionService $deletionService,
    ) {
    }

    public function index(): JsonResponse
    {
        $hosts = $this->repository->getWithViewDetails()->map(fn (DatabaseHost $host) => [
            'id' => $host->id,
            'name' => $host->name,
            'host' => $host->host,
            'port' => $host->port,
            'username' => $host->username,
            'databases_count' => $host->databases_count,
            'node' => $host->node ? [
                'id' => $host->node->id,
                'name' => $host->node->name,
            ] : null,
        ]);

        return response()->json(['hosts' => $hosts]);
    }

    public function create(): JsonResponse
    {
        return response()->json([
            'locations' => $this->locationRepository->getAllWithNodes()->map(fn ($location) => [
                'id' => $location->id,
                'short' => $location->short,
                'nodes' => $location->nodes->map(fn ($node) => [
                    'id' => $node->id,
                    'name' => $node->name,
                ])->values(),
            ])->values(),
        ]);
    }

    /**
     * @throws RecordNotFoundException
     */
    public function show(Request $request, int $host): JsonResponse
    {
        $model = $this->repository->find($host);
        $databases = $this->databaseRepository->getDatabasesForHost($host, 25);

        return response()->json([
            'host' => [
                'id' => $model->id,
                'name' => $model->name,
                'host' => $model->host,
                'port' => $model->port,
                'username' => $model->username,
                'node_id' => $model->node_id,
            ],
            'locations' => $this->locationRepository->getAllWithNodes()->map(fn ($location) => [
                'id' => $location->id,
                'short' => $location->short,
                'nodes' => $location->nodes->map(fn ($node) => [
                    'id' => $node->id,
                    'name' => $node->name,
                ])->values(),
            ])->values(),
            'databases' => collect($databases->items())->map(fn ($database) => [
                'id' => $database->id,
                'database' => $database->database,
                'username' => $database->username,
                'remote' => $database->remote,
                'max_connections' => $database->max_connections,
                'server' => [
                    'id' => $database->server->id,
                    'name' => $database->server->name,
                ],
            ])->values(),
            'pagination' => [
                'current_page' => $databases->currentPage(),
                'last_page' => $databases->lastPage(),
                'total' => $databases->total(),
            ],
        ]);
    }

    /**
     * @throws DataValidationException
     * @throws Throwable
     */
    public function store(DatabaseHostFormRequest $request): JsonResponse
    {
        try {
            $host = $this->creationService->handle($request->normalize());
        } catch (Exception $exception) {
            if ($exception instanceof PDOException || $exception->getPrevious() instanceof PDOException) {
                return response()->json([
                    'message' => sprintf(
                        'There was an error while trying to connect to the host or while executing a query: "%s"',
                        $exception->getMessage()
                    ),
                ], 422);
            }

            throw $exception;
        }

        return response()->json([
            'success' => true,
            'message' => 'Successfully created a new database host on the system.',
            'host' => [
                'id' => $host->id,
                'name' => $host->name,
            ],
        ]);
    }

    /**
     * @throws DataValidationException
     * @throws Throwable
     */
    public function update(DatabaseHostFormRequest $request, DatabaseHost $host): JsonResponse
    {
        try {
            $this->updateService->handle($host->id, $request->normalize());
        } catch (Exception $exception) {
            if ($exception instanceof PDOException || $exception->getPrevious() instanceof PDOException) {
                return response()->json([
                    'message' => sprintf(
                        'There was an error while trying to connect to the host or while executing a query: "%s"',
                        $exception->getMessage()
                    ),
                ], 422);
            }

            throw $exception;
        }

        return response()->json([
            'success' => true,
            'message' => 'Database host was updated successfully.',
        ]);
    }

    public function destroy(int $host): JsonResponse
    {
        $this->deletionService->handle($host);

        return response()->json([
            'success' => true,
            'message' => 'The requested database host has been deleted from the system.',
        ]);
    }
}
