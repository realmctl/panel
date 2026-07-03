<?php

namespace Realm\Services\Files;

use Throwable;
use Carbon\CarbonImmutable;
use Realm\Enum\JwtScope;
use Realm\Models\User;
use Realm\Models\Server;
use Realm\Services\Nodes\NodeJWTService;
use Realm\Repositories\Wings\DaemonFileRepository;
use Realm\Exceptions\DisplayException;

/**
 * Copies or moves files between two servers the user has access to. Works both when the
 * servers live on the same node and across different nodes, without requiring any changes
 * to Wings.
 *
 * The selected files are archived on the source server, the archive is pulled onto the
 * destination server via a short-lived signed download URL, unpacked there, and the
 * temporary archives are cleaned up on both ends. When moving, the originals on the source
 * are deleted only after the transfer has completed successfully.
 */
class FileTransferService
{
    public function __construct(
        private NodeJWTService $jwtService,
        private DaemonFileRepository $fileRepository,
    ) {
    }

    /**
     * @param string[] $files
     *
     * @throws \Realm\Exceptions\DisplayException
     * @throws \Realm\Exceptions\Http\Connection\DaemonConnectionException
     */
    public function handle(
        User $user,
        Server $source,
        Server $destination,
        string $sourceDirectory,
        array $files,
        string $destinationDirectory,
        bool $move,
    ): void {
        if ($source->uuid === $destination->uuid) {
            throw new DisplayException('The source and destination servers cannot be the same.');
        }

        // Archive the selection on the source server. Using an archive gives us a single
        // artifact to move and transparently handles directories as well as multiple files.
        $archive = $this->fileRepository->setServer($source)->compressFiles($sourceDirectory, $files);
        $archiveName = $archive['name'] ?? ($archive['attributes']['name'] ?? null);

        if (!is_string($archiveName) || $archiveName === '') {
            throw new DisplayException('Failed to determine the archive name returned by the source node.');
        }

        $archivePath = $this->join($sourceDirectory, $archiveName);

        try {
            // Mint a short-lived signed URL that lets the destination node download the
            // archive directly from the source node.
            $token = $this->jwtService
                ->setExpiresAt(CarbonImmutable::now()->addMinutes(15))
                ->setUser($user)
                ->setClaims([
                    'file_path' => $archivePath,
                    'server_uuid' => $source->uuid,
                ])
                ->setScopes(JwtScope::FileDownload)
                ->handle($source->node, $user->id . $source->uuid);

            $url = sprintf(
                '%s/download/file?token=%s',
                $source->node->getConnectionAddress(),
                $token->toString(),
            );

            // Pull the archive onto the destination in the foreground so we can safely unpack
            // it as soon as the request returns.
            $this->fileRepository->setServer($destination)->pull($url, $destinationDirectory, [
                'filename' => $archiveName,
                'foreground' => true,
            ]);

            $this->fileRepository->setServer($destination)->decompressFile($destinationDirectory, $archiveName);
        } finally {
            // Best-effort cleanup of the temporary archives on both ends regardless of outcome.
            $this->cleanup($source, $sourceDirectory, $archiveName);
            $this->cleanup($destination, $destinationDirectory, $archiveName);
        }

        if ($move) {
            $this->fileRepository->setServer($source)->deleteFiles($sourceDirectory, $files);
        }
    }

    private function cleanup(Server $server, string $directory, string $file): void
    {
        try {
            $this->fileRepository->setServer($server)->deleteFiles($directory, [$file]);
        } catch (Throwable) {
            // Ignore: a leftover temp archive is harmless and should not fail the transfer.
        }
    }

    private function join(string $directory, string $file): string
    {
        return rtrim($directory, '/') . '/' . ltrim($file, '/');
    }
}
