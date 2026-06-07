<?php

namespace Realm\Http\Controllers\Api\Application\Servers;

use Realm\Exceptions\DisplayException;
use Realm\Exceptions\Model\DataValidationException;
use Realm\Exceptions\Repository\RecordNotFoundException;
use Realm\Models\Server;
use Realm\Services\Servers\BuildModificationService;
use Realm\Services\Servers\DetailsModificationService;
use Realm\Transformers\Api\Application\ServerTransformer;
use Realm\Http\Controllers\Api\Application\ApplicationApiController;
use Realm\Http\Requests\Api\Application\Servers\UpdateServerDetailsRequest;
use Realm\Http\Requests\Api\Application\Servers\UpdateServerBuildConfigurationRequest;

class ServerDetailsController extends ApplicationApiController
{
    /**
     * ServerDetailsController constructor.
     */
    public function __construct(
        private BuildModificationService $buildModificationService,
        private DetailsModificationService $detailsModificationService,
    ) {
        parent::__construct();
    }

    /**
     * Update the details for a specific server.
     *
     * @throws DisplayException
     * @throws DataValidationException
     * @throws RecordNotFoundException
     */
    public function details(UpdateServerDetailsRequest $request, Server $server): array
    {
        $updated = $this->detailsModificationService->returnUpdatedModel()->handle(
            $server,
            $request->validated()
        );

        return $this->fractal->item($updated)
            ->transformWith($this->getTransformer(ServerTransformer::class))
            ->toArray();
    }

    /**
     * Update the build details for a specific server.
     *
     * @throws DisplayException
     * @throws DataValidationException
     * @throws RecordNotFoundException
     */
    public function build(UpdateServerBuildConfigurationRequest $request, Server $server): array
    {
        $server = $this->buildModificationService->handle($server, $request->validated());

        return $this->fractal->item($server)
            ->transformWith($this->getTransformer(ServerTransformer::class))
            ->toArray();
    }
}
