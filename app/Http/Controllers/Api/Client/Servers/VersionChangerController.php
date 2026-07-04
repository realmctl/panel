<?php

// TODO(developers): This entire version changer system needs a thorough review before it can be considered stable.
// Known issues and things to verify:
//
// 1. ASYNC PULL — Wings' pull() may return before the file is actually downloaded.
//    The install() response currently says "success" while the download is still in progress.
//    Solution: poll Wings for the file's existence after pull(), or use a job/queue with websocket feedback.
//
// 2. OVERWRITE BEHAVIOUR — It is not confirmed whether Wings' pull() overwrites an existing server.jar.
//    If it does not, the download will silently fail (or error) when the file already exists.
//    The old code deleted the jar first (causing data loss on failure). Current code skips the delete —
//    verify Wings behaviour and handle accordingly.
//
// 3. FORGE — Forge ships an *installer*, not a runnable server jar. Wings only exposes file operations
//    and console-stdin ("send command" to an already-running process) — there is no way for the panel
//    to execute an arbitrary OS command (`java -jar forge-installer.jar --installServer`) inside the
//    container before the server has started. We download the installer and surface a manual step
//    instead of pretending this is a real one-click install. Fix properly once Wings exposes an
//    "exec one-off command" daemon endpoint.
//
// 4. ERROR PROPAGATION — getDownloadUrl() is called with a plain new Request() inside install().
//    This bypasses Laravel's request lifecycle. Refactor to extract URL resolution into a separate service class.
//
// 5. NO INTEGRITY CHECK — Downloaded jars are not checksum-verified (e.g. SHA256). Paper's Fill API and
//    Mojang both expose checksums in their responses, but Wings' pull() has no parameter to enforce one
//    (see DaemonFileRepository::pull()) — this needs a Wings-side change to fix for real.
//
// 6. SERVER_JARFILE VARIABLE — updateOrCreate on the egg variable assumes the egg always uses SERVER_JARFILE.
//    This will silently do nothing for eggs that use a different variable name.

namespace Realm\Http\Controllers\Api\Client\Servers;

use Realm\Models\Server;
use Realm\Facades\Activity;
use Realm\Http\Controllers\Api\Client\ClientApiController;
use Realm\Http\Controllers\Api\Client\Servers\Concerns\ChecksEggCategoryFeature;
use Illuminate\Support\Facades\Http;
use Realm\Repositories\Wings\DaemonFileRepository;
use Realm\Http\Requests\Api\Client\Servers\Versions\ListVersionsRequest;
use Realm\Http\Requests\Api\Client\Servers\Versions\GetDownloadUrlRequest;
use Realm\Http\Requests\Api\Client\Servers\Versions\InstallVersionRequest;
use Realm\Http\Requests\Api\Client\Servers\Versions\MarkCustomVersionRequest;

class VersionChangerController extends ClientApiController
{
    use ChecksEggCategoryFeature;

    public function __construct(
        private DaemonFileRepository $fileRepository,
    ) {
        parent::__construct();
    }

    /**
     * PaperMC's Fill v3 API requires a non-generic User-Agent identifying the calling application.
     * The old api.papermc.io v2 API this used to call is disabled as of 2026-07-01.
     */
    protected function paperClient()
    {
        return Http::withHeaders([
            'User-Agent' => 'RealmPanel/1.0 (+' . config('app.url') . ')',
        ]);
    }

    /**
     * List available versions for a given server type.
     */
    public function listVersions(ListVersionsRequest $request, Server $server): array
    {
        $this->ensureServerSupportsFeature($server, 'versions');

        $type = $request->get('type', 'paper');
        $versions = [];

        switch ($type) {
            case 'paper':
            case 'velocity':
            case 'folia':
            case 'waterfall':
                $response = $this->paperClient()->get("https://fill.papermc.io/v3/projects/{$type}");
                if ($response->successful()) {
                    // Fill v3 groups versions by major branch, e.g. {"1.21": ["1.21.4", "1.21.3", ...], "26.1": [...]}.
                    // Branches and entries are already returned newest-first.
                    $versions = collect($response->json('versions', []))
                        ->flatten()
                        ->values()
                        ->toArray();
                }
                break;

            case 'purpur':
                $response = Http::get('https://api.purpurmc.org/v2/purpur');
                if ($response->successful()) {
                    $versions = array_reverse($response->json('versions', []));
                }
                break;

            case 'vanilla':
                $response = Http::get('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json');
                if ($response->successful()) {
                    $allVersions = $response->json('versions', []);
                    $versions = collect($allVersions)
                        ->where('type', 'release')
                        ->pluck('id')
                        ->values()
                        ->toArray();
                }
                break;

            case 'snapshot':
                $response = Http::get('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json');
                if ($response->successful()) {
                    $allVersions = $response->json('versions', []);
                    $versions = collect($allVersions)
                        ->where('type', 'snapshot')
                        ->pluck('id')
                        ->take(50)
                        ->values()
                        ->toArray();
                }
                break;

            case 'fabric':
                $response = Http::get('https://meta.fabricmc.net/v2/versions/game');
                if ($response->successful()) {
                    $versions = collect($response->json())
                        ->where('stable', true)
                        ->pluck('version')
                        ->values()
                        ->toArray();
                }
                break;

            case 'forge':
                $response = Http::get('https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json');
                if ($response->successful()) {
                    $versions = collect($response->json('promos', []))
                        ->keys()
                        ->map(fn (string $key) => preg_replace('/-(recommended|latest)$/', '', $key))
                        ->unique()
                        ->reverse()
                        ->values()
                        ->toArray();
                }
                break;

            case 'neoforge':
                $response = Http::get('https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge');
                if ($response->successful()) {
                    $versions = array_reverse($response->json('versions', []));
                }
                break;
        }

        return [
            'type' => $type,
            'versions' => $versions,
        ];
    }

    /**
     * Get the download URL for a specific version.
     */
    public function getDownloadUrl(GetDownloadUrlRequest $request, Server $server): array
    {
        $this->ensureServerSupportsFeature($server, 'versions');

        return $this->resolveDownloadUrl($request->get('type', 'paper'), $request->get('version'));
    }

    /**
     * Resolve the Forge build string (e.g. "1.20.1-47.4.10") for a Minecraft version,
     * preferring the recommended build and falling back to latest.
     */
    protected function resolveForgeBuild(string $version): ?string
    {
        $response = Http::get('https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json');
        if (!$response->successful()) {
            return null;
        }

        $promos = $response->json('promos', []);
        $forgeVersion = $promos["{$version}-recommended"] ?? $promos["{$version}-latest"] ?? null;

        return $forgeVersion ? "{$version}-{$forgeVersion}" : null;
    }

    /**
     * Resolve the download URL for a version without requiring an HTTP request.
     */
    protected function resolveDownloadUrl(?string $type, ?string $version): array
    {
        $type = $type ?: 'paper';

        if (!$version) {
            return ['error' => 'Version is required'];
        }

        $url = null;
        $filename = 'server.jar';
        $build = null;

        switch ($type) {
            case 'paper':
            case 'velocity':
            case 'folia':
            case 'waterfall':
                // Fill v3: builds are returned newest-first, unlike the old v2 API.
                $buildsResponse = $this->paperClient()
                    ->get("https://fill.papermc.io/v3/projects/{$type}/versions/{$version}/builds");
                if ($buildsResponse->successful()) {
                    $builds = $buildsResponse->json();
                    $latestBuild = $builds[0] ?? null;
                    if ($latestBuild) {
                        $download = $latestBuild['downloads']['server:default'] ?? null;
                        if ($download) {
                            $url = $download['url'];
                            $filename = $download['name'];
                            $build = (string) $latestBuild['id'];
                        }
                    }
                }
                break;

            case 'purpur':
                $metaResponse = Http::get("https://api.purpurmc.org/v2/purpur/{$version}");
                if ($metaResponse->successful()) {
                    $latestBuild = $metaResponse->json('builds.latest');
                    if ($latestBuild) {
                        $url = "https://api.purpurmc.org/v2/purpur/{$version}/{$latestBuild}/download";
                        $filename = "purpur-{$version}-{$latestBuild}.jar";
                        $build = (string) $latestBuild;
                    }
                }
                break;

            case 'vanilla':
            case 'snapshot':
                $manifestResponse = Http::get('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json');
                if ($manifestResponse->successful()) {
                    $versionData = collect($manifestResponse->json('versions', []))
                        ->firstWhere('id', $version);
                    if ($versionData) {
                        $versionDetailResponse = Http::get($versionData['url']);
                        if ($versionDetailResponse->successful()) {
                            $url = $versionDetailResponse->json('downloads.server.url');
                            $filename = 'server.jar';
                        }
                    }
                }
                break;

            case 'fabric':
                // Get latest loader and installer versions
                $loaderResponse = Http::get('https://meta.fabricmc.net/v2/versions/loader');
                $installerResponse = Http::get('https://meta.fabricmc.net/v2/versions/installer');
                if ($loaderResponse->successful() && $installerResponse->successful()) {
                    $loader = $loaderResponse->json()[0]['version'] ?? null;
                    $installer = $installerResponse->json()[0]['version'] ?? null;
                    if ($loader && $installer) {
                        $url = "https://meta.fabricmc.net/v2/versions/loader/{$version}/{$loader}/{$installer}/server/jar";
                        $filename = "fabric-server-mc.{$version}-loader.{$loader}-launcher.{$installer}.jar";
                        $build = "{$loader}+{$installer}";
                    }
                }
                break;

            case 'forge':
                $full = $this->resolveForgeBuild($version);
                if ($full) {
                    $url = "https://maven.minecraftforge.net/net/minecraftforge/forge/{$full}/forge-{$full}-installer.jar";
                    $filename = 'forge-installer.jar';
                    $build = $full;
                }
                break;

            case 'neoforge':
                $url = "https://maven.neoforged.net/releases/net/neoforged/neoforge/{$version}/neoforge-{$version}-installer.jar";
                $filename = 'neoforge-installer.jar';
                $build = $version;
                break;
        }

        if (!$url) {
            return ['error' => 'Could not resolve download URL for this version'];
        }

        return [
            'url' => $url,
            'filename' => $filename,
            'build' => $build,
        ];
    }

    /**
     * Install a specific version on the server.
     */
    public function install(InstallVersionRequest $request, Server $server): array
    {
        $this->ensureServerSupportsFeature($server, 'versions');

        $type = $request->input('type');
        $version = $request->input('version');
        $isInstallerOnly = in_array($type, ['forge', 'neoforge'], true);

        // Get the download URL
        $downloadData = $this->resolveDownloadUrl($type, $version);

        if (isset($downloadData['error'])) {
            return ['success' => false, 'error' => $downloadData['error']];
        }

        $url = $downloadData['url'];
        $filename = $downloadData['filename'];
        // Forge/NeoForge only ship an installer — it must not overwrite the runnable server.jar.
        $targetFilename = $isInstallerOnly ? $filename : 'server.jar';

        try {
            // Download the new jar first, then clean up the old one only on success.
            // Deleting first caused the jar to disappear permanently when the download failed.
            $this->fileRepository->setServer($server)->pull($url, '/', ['filename' => $targetFilename]);
        } catch (\Exception $e) {
            return ['success' => false, 'error' => 'Failed to download: ' . $e->getMessage()];
        }

        // Remove any leftover jar with the original versioned filename (e.g. paper-1.20.4-123.jar)
        if ($filename !== $targetFilename) {
            try {
                $this->fileRepository->setServer($server)->deleteFiles('/', [$filename]);
            } catch (\Exception $e) {
                // File might not exist, that's fine
            }
        }

        if (!$isInstallerOnly) {
            // Update the SERVER_JARFILE variable to server.jar
            $eggVariable = $server->egg->variables()->where('env_variable', 'SERVER_JARFILE')->first();
            if ($eggVariable) {
                \Realm\Models\ServerVariable::updateOrCreate(
                    ['server_id' => $server->id, 'variable_id' => $eggVariable->id],
                    ['variable_value' => 'server.jar']
                );
            }
        }

        $server->update([
            'installed_software' => $type,
            'installed_version' => $version,
            'installed_build' => $downloadData['build'] ?? null,
        ]);

        Activity::event('server:versions.install')
            ->property('name', "{$type} {$version}")
            ->log();

        return [
            'success' => true,
            'filename' => $targetFilename,
            'version' => "{$type} {$version}",
            'requires_manual_step' => $isInstallerOnly,
        ];
    }

    /**
     * Record that a custom jar was uploaded and installed manually through the file manager.
     * The upload/rename itself happens client-side via the regular files API.
     */
    public function markCustom(MarkCustomVersionRequest $request, Server $server): array
    {
        $this->ensureServerSupportsFeature($server, 'versions');

        $server->update([
            'installed_software' => 'custom',
            'installed_version' => $request->input('filename'),
            'installed_build' => null,
        ]);

        Activity::event('server:versions.install')
            ->property('name', 'Custom (' . $request->input('filename') . ')')
            ->log();

        return ['success' => true];
    }
}
