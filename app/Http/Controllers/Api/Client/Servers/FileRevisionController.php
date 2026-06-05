<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Illuminate\Http\Response;
use Pterodactyl\Models\Server;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Models\FileRevision;
use Pterodactyl\Services\Files\FileRevisionService;
use Pterodactyl\Transformers\Api\Client\FileRevisionTransformer;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Http\Requests\Api\Client\Servers\Files\Revisions\ListRevisionsRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Files\Revisions\ViewRevisionRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Files\Revisions\RestoreRevisionRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Files\Revisions\DeleteRevisionRequest;

class FileRevisionController extends ClientApiController
{
    public function __construct(
        private FileRevisionService $revisionService,
    ) {
        parent::__construct();
    }

    /**
     * List revisions for a specific file.
     */
    public function index(ListRevisionsRequest $request, Server $server): array
    {
        $filePath = rawurldecode($request->get('file'));
        $revisions = $this->revisionService->getRevisions(
            $server,
            $filePath,
            $request->get('per_page', 50),
            $request->get('page', 1)
        );

        return $this->fractal->collection($revisions->items())
            ->transformWith($this->getTransformer(FileRevisionTransformer::class))
            ->toArray();
    }

    /**
     * View a specific revision's content.
     */
    public function view(ViewRevisionRequest $request, Server $server, string $revision): Response
    {
        $rev = $this->revisionService->getRevision($server, $revision);

        if (!$rev) {
            abort(404, 'Revision not found.');
        }

        return new Response($rev->content ?? '', Response::HTTP_OK, ['Content-Type' => 'text/plain']);
    }

    /**
     * Restore a revision to the current file.
     */
    public function restore(RestoreRevisionRequest $request, Server $server, string $revision): JsonResponse
    {
        $rev = $this->revisionService->getRevision($server, $revision);

        if (!$rev) {
            abort(404, 'Revision not found.');
        }

        $this->revisionService->restoreRevision($server, $rev, $request->user()->id);

        return new JsonResponse([], Response::HTTP_NO_CONTENT);
    }

    /**
     * Download a revision's content.
     */
    public function download(ViewRevisionRequest $request, Server $server, string $revision): Response
    {
        $rev = $this->revisionService->getRevision($server, $revision);

        if (!$rev) {
            abort(404, 'Revision not found.');
        }

        $filename = basename($rev->file_path) . '.rev-' . $rev->created_at->format('Y-m-d_His');

        Activity::event('server:file.revision-downloaded')
            ->property('file', $rev->file_path)
            ->property('revision_id', $rev->uuid)
            ->log();

        return new Response($rev->content ?? '', Response::HTTP_OK, [
            'Content-Type' => 'application/octet-stream',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'Content-Length' => $rev->size,
        ]);
    }

    /**
     * Delete a specific revision.
     */
    public function delete(DeleteRevisionRequest $request, Server $server, string $revision): JsonResponse
    {
        $rev = $this->revisionService->getRevision($server, $revision);

        if (!$rev) {
            abort(404, 'Revision not found.');
        }

        Activity::event('server:file.revision-deleted')
            ->property('file', $rev->file_path)
            ->property('revision_id', $rev->uuid)
            ->log();

        $this->revisionService->deleteRevision($rev);

        return new JsonResponse([], Response::HTTP_NO_CONTENT);
    }
}
