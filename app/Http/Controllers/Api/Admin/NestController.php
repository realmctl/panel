<?php

namespace Realm\Http\Controllers\Api\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Realm\Exceptions\Model\DataValidationException;
use Realm\Exceptions\Service\HasActiveServersException;
use Realm\Http\Controllers\Controller;
use Realm\Http\Requests\Admin\Nest\StoreNestFormRequest;
use Realm\Models\Nest;
use Realm\Contracts\Repository\NestRepositoryInterface;
use Realm\Services\Nests\NestCreationService;
use Realm\Services\Nests\NestDeletionService;
use Realm\Services\Nests\NestUpdateService;

class NestController extends Controller
{
    public function __construct(
        private NestRepositoryInterface $repository,
        private NestCreationService $nestCreationService,
        private NestUpdateService $nestUpdateService,
        private NestDeletionService $nestDeletionService,
    ) {
    }

    public function index(): JsonResponse
    {
        $nests = collect($this->repository->getWithCounts())->map(fn ($nest) => [
            'id' => $nest->id,
            'name' => $nest->name,
            'author' => $nest->author,
            'description' => $nest->description,
            'eggs_count' => $nest->eggs_count,
            'servers_count' => $nest->servers_count,
        ])->values();

        return response()->json(['nests' => $nests]);
    }

    /**
     * @throws DataValidationException
     */
    public function store(StoreNestFormRequest $request): JsonResponse
    {
        $nest = $this->nestCreationService->handle($request->normalize());

        return response()->json([
            'success' => true,
            'message' => trans('admin/nests.notices.created', ['name' => htmlspecialchars($nest->name)]),
            'nest' => ['id' => $nest->id],
        ], 201);
    }

    public function show(Nest $nest): JsonResponse
    {
        $nest = $this->repository->getWithEggServers($nest->id);

        return response()->json([
            'nest' => [
                'id' => $nest->id,
                'name' => $nest->name,
                'author' => $nest->author,
                'description' => $nest->description,
                'uuid' => $nest->uuid,
            ],
            'eggs' => $nest->eggs->map(fn ($egg) => [
                'id' => $egg->id,
                'name' => $egg->name,
                'description' => $egg->description,
                'servers_count' => $egg->servers->count(),
            ])->values(),
        ]);
    }

    /**
     * @throws DataValidationException
     */
    public function update(StoreNestFormRequest $request, Nest $nest): JsonResponse
    {
        $this->nestUpdateService->handle($nest->id, $request->normalize());

        return response()->json([
            'success' => true,
            'message' => trans('admin/nests.notices.updated'),
        ]);
    }

    /**
     * @throws HasActiveServersException
     */
    public function destroy(Nest $nest): Response
    {
        $this->nestDeletionService->handle($nest->id);

        return response('', 204);
    }
}
