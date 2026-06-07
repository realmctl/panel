<?php

namespace Realm\Http\Controllers\Api\Application\Nodes;

use Realm\Exceptions\DisplayException;
use Realm\Exceptions\Service\Allocation\CidrOutOfRangeException;
use Realm\Exceptions\Service\Allocation\InvalidPortMappingException;
use Realm\Exceptions\Service\Allocation\PortOutOfRangeException;
use Realm\Exceptions\Service\Allocation\TooManyPortsInRangeException;
use Realm\Exceptions\Service\Allocation\ServerUsingAllocationException;
use Realm\Models\Node;
use Illuminate\Http\JsonResponse;
use Realm\Models\Allocation;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;
use Illuminate\Database\Eloquent\Builder;
use Realm\Services\Allocations\AssignmentService;
use Realm\Services\Allocations\AllocationDeletionService;
use Realm\Transformers\Api\Application\AllocationTransformer;
use Realm\Http\Controllers\Api\Application\ApplicationApiController;
use Realm\Http\Requests\Api\Application\Allocations\GetAllocationsRequest;
use Realm\Http\Requests\Api\Application\Allocations\StoreAllocationRequest;
use Realm\Http\Requests\Api\Application\Allocations\DeleteAllocationRequest;

class AllocationController extends ApplicationApiController
{
    /**
     * AllocationController constructor.
     */
    public function __construct(
        private AssignmentService $assignmentService,
        private AllocationDeletionService $deletionService,
    ) {
        parent::__construct();
    }

    /**
     * Return all the allocations that exist for a given node.
     */
    public function index(GetAllocationsRequest $request, Node $node): array
    {
        $allocations = QueryBuilder::for($node->allocations())
            ->allowedFilters([
                AllowedFilter::exact('ip'),
                AllowedFilter::exact('port'),
                'ip_alias',
                AllowedFilter::callback('server_id', function (Builder $builder, $value) {
                    if (empty($value) || is_bool($value) || !ctype_digit((string) $value)) {
                        return $builder->whereNull('server_id');
                    }

                    return $builder->where('server_id', $value);
                }),
            ])
            ->paginate($request->query('per_page') ?? 50);

        return $this->fractal->collection($allocations)
            ->transformWith($this->getTransformer(AllocationTransformer::class))
            ->toArray();
    }

    /**
     * Store new allocations for a given node.
     *
     * @throws DisplayException
     * @throws CidrOutOfRangeException
     * @throws InvalidPortMappingException
     * @throws PortOutOfRangeException
     * @throws TooManyPortsInRangeException
     */
    public function store(StoreAllocationRequest $request, Node $node): JsonResponse
    {
        $this->assignmentService->handle($node, $request->validated());

        return new JsonResponse([], JsonResponse::HTTP_NO_CONTENT);
    }

    /**
     * Delete a specific allocation from the Panel.
     *
     * @throws ServerUsingAllocationException
     */
    public function delete(DeleteAllocationRequest $request, Node $node, Allocation $allocation): JsonResponse
    {
        $this->deletionService->handle($allocation);

        return new JsonResponse([], JsonResponse::HTTP_NO_CONTENT);
    }
}
