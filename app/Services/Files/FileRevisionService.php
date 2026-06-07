<?php

namespace Realm\Services\Files;

use Throwable;
use Illuminate\Support\Str;
use Realm\Models\Server;
use Realm\Models\FileRevision;
use Realm\Facades\Activity;
use Realm\Repositories\Wings\DaemonFileRepository;
use Illuminate\Database\ConnectionInterface;

class FileRevisionService
{
    public function __construct(
        private DaemonFileRepository $fileRepository,
        private ConnectionInterface $connection,
    ) {
    }

    /**
     * Create a revision by fetching the current file content from the daemon
     * before it gets overwritten.
     */
    public function createRevisionBeforeWrite(Server $server, string $filePath, ?int $userId, string $action = FileRevision::ACTION_EDITED): ?FileRevision
    {
        try {
            $content = $this->fileRepository->setServer($server)->getContent($filePath, null);
        } catch (Throwable) {
            // File doesn't exist yet (new file), no revision to create
            return null;
        }

        return $this->storeRevision($server, $filePath, $content, $userId, $action);
    }

    /**
     * Store a revision with the given content.
     */
    public function storeRevision(Server $server, string $filePath, string $content, ?int $userId, string $action = FileRevision::ACTION_EDITED): FileRevision
    {
        $revision = new FileRevision();
        $revision->forceFill([
            'uuid' => Str::uuid()->toString(),
            'server_id' => $server->id,
            'file_path' => $this->normalizePath($filePath),
            'hash' => hash('sha256', $content),
            'size' => strlen($content),
            'user_id' => $userId,
            'action' => $action,
            'content' => $content,
        ]);

        $revision->skipValidation()->save();

        $this->pruneIfNeeded($server, $filePath);

        return $revision;
    }

    /**
     * Restore a revision to the current file. First saves the current file as a new revision.
     */
    public function restoreRevision(Server $server, FileRevision $revision, ?int $userId): FileRevision
    {
        return $this->connection->transaction(function () use ($server, $revision, $userId) {
            // Save current file as a revision before restoring
            $this->createRevisionBeforeWrite($server, $revision->file_path, $userId, FileRevision::ACTION_RESTORED);

            // Write the revision content back to the file
            $this->fileRepository->setServer($server)->putContent($revision->file_path, $revision->content ?? '');

            Activity::event('server:file.revision-restored')
                ->property('file', $revision->file_path)
                ->property('revision_id', $revision->uuid)
                ->log();

            return $revision;
        });
    }

    /**
     * Get revisions for a specific file on a server.
     */
    public function getRevisions(Server $server, string $filePath, int $limit = 50, int $page = 1)
    {
        return FileRevision::where('server_id', $server->id)
            ->where('file_path', $this->normalizePath($filePath))
            ->orderByDesc('created_at')
            ->paginate($limit, ['*'], 'page', $page);
    }

    /**
     * Get a specific revision.
     */
    public function getRevision(Server $server, string $uuid): ?FileRevision
    {
        return FileRevision::where('server_id', $server->id)
            ->where('uuid', $uuid)
            ->first();
    }

    /**
     * Delete a specific revision.
     */
    public function deleteRevision(FileRevision $revision): void
    {
        $revision->delete();
    }

    /**
     * Prune old revisions based on retention settings.
     */
    public function pruneIfNeeded(Server $server, string $filePath): void
    {
        $maxRevisions = config('realm.files.revisions.max_per_file');
        $maxAgeDays = config('realm.files.revisions.max_age_days');
        $maxStorageBytes = config('realm.files.revisions.max_storage_per_server');

        $normalizedPath = $this->normalizePath($filePath);

        // Prune by max revisions per file
        if ($maxRevisions && $maxRevisions > 0) {
            $revisionIds = FileRevision::where('server_id', $server->id)
                ->where('file_path', $normalizedPath)
                ->orderByDesc('created_at')
                ->skip($maxRevisions)
                ->pluck('id');

            if ($revisionIds->isNotEmpty()) {
                FileRevision::whereIn('id', $revisionIds)->delete();
            }
        }

        // Prune by max age
        if ($maxAgeDays && $maxAgeDays > 0) {
            FileRevision::where('server_id', $server->id)
                ->where('created_at', '<', now()->subDays($maxAgeDays))
                ->delete();
        }

        // Prune by max total storage per server
        if ($maxStorageBytes && $maxStorageBytes > 0) {
            $totalSize = FileRevision::where('server_id', $server->id)->sum('size');

            if ($totalSize > $maxStorageBytes) {
                // Delete oldest revisions until we're under the limit
                $revisions = FileRevision::where('server_id', $server->id)
                    ->orderBy('created_at')
                    ->get(['id', 'size']);

                $toDelete = [];
                foreach ($revisions as $rev) {
                    if ($totalSize <= $maxStorageBytes) {
                        break;
                    }
                    $toDelete[] = $rev->id;
                    $totalSize -= $rev->size;
                }

                if (!empty($toDelete)) {
                    FileRevision::whereIn('id', $toDelete)->delete();
                }
            }
        }
    }

    /**
     * Normalize a file path for consistent storage.
     */
    private function normalizePath(string $path): string
    {
        $path = '/' . ltrim($path, '/');
        // Remove double slashes
        $path = preg_replace('#/+#', '/', $path);

        return $path;
    }
}
