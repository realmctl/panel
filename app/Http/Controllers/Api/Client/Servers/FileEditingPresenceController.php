<?php

namespace Realm\Http\Controllers\Api\Client\Servers;

use Illuminate\Http\JsonResponse;
use Realm\Models\Server;
use Realm\Services\Files\FileEditingPresenceService;
use Realm\Http\Controllers\Api\Client\ClientApiController;
use Realm\Http\Requests\Api\Client\Servers\Files\ClearFileEditingPresenceRequest;
use Realm\Http\Requests\Api\Client\Servers\Files\GetFileEditingPresenceRequest;
use Realm\Http\Requests\Api\Client\Servers\Files\UpdateFileEditingPresenceRequest;

class FileEditingPresenceController extends ClientApiController
{
    public function __construct(private FileEditingPresenceService $presenceService)
    {
        parent::__construct();
    }

    public function index(GetFileEditingPresenceRequest $request, Server $server): JsonResponse
    {
        return new JsonResponse([
            'data' => $this->presenceService->list($server),
        ]);
    }

    public function update(UpdateFileEditingPresenceRequest $request, Server $server): JsonResponse
    {
        $file = '/' . ltrim(rawurldecode($request->input('file')), '/');

        $this->presenceService->upsert(
            $server,
            $request->user(),
            $file,
            (int) $request->input('line'),
        );

        return new JsonResponse([], JsonResponse::HTTP_NO_CONTENT);
    }

    public function destroy(ClearFileEditingPresenceRequest $request, Server $server): JsonResponse
    {
        $this->presenceService->clear($server, $request->user());

        return new JsonResponse([], JsonResponse::HTTP_NO_CONTENT);
    }
}
