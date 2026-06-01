<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Pterodactyl\Models\Server;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;

class VersionChangerController extends ClientApiController
{
    public function __construct(
        private DaemonFileRepository $fileRepository,
    ) {
        parent::__construct();
    }

    /**
     * List available versions for a given server type.
     */
    public function listVersions(Request $request): array
    {
        $type = $request->get('type', 'paper');
        $versions = [];

        switch ($type) {
            case 'paper':
                $response = Http::get('https://api.papermc.io/v2/projects/paper');
                if ($response->successful()) {
                    $versions = array_reverse($response->json('versions', []));
                }
                break;

            case 'purpur':
                $response = Http::get('https://api.purpurmc.org/v2/purpur');
                if ($response->successful()) {
                    $versions = array_reverse($response->json('versions', []));
                }
                break;

            case 'velocity':
                $response = Http::get('https://api.papermc.io/v2/projects/velocity');
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

            case 'spigot':
                // Spigot doesn't have a public API for versions, use known versions
                $versions = [
                    '1.21.4', '1.21.3', '1.21.2', '1.21.1', '1.21',
                    '1.20.6', '1.20.4', '1.20.2', '1.20.1', '1.20',
                    '1.19.4', '1.19.3', '1.19.2', '1.19.1', '1.19',
                    '1.18.2', '1.18.1', '1.18',
                    '1.17.1', '1.17',
                    '1.16.5', '1.16.4', '1.16.3', '1.16.2', '1.16.1',
                    '1.15.2', '1.15.1', '1.15',
                    '1.14.4', '1.14.3', '1.14.2', '1.14.1', '1.14',
                    '1.13.2', '1.13.1', '1.13',
                    '1.12.2', '1.12.1', '1.12',
                    '1.11.2', '1.11.1', '1.11',
                    '1.10.2', '1.10',
                    '1.9.4', '1.9.2', '1.9',
                    '1.8.8', '1.8',
                ];
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
        }

        return [
            'type' => $type,
            'versions' => $versions,
        ];
    }

    /**
     * Get the download URL for a specific version.
     */
    public function getDownloadUrl(Request $request): array
    {
        $type = $request->get('type', 'paper');
        $version = $request->get('version');

        if (!$version) {
            return ['error' => 'Version is required'];
        }

        $url = null;
        $filename = 'server.jar';

        switch ($type) {
            case 'paper':
                // Get latest build for this version
                $buildsResponse = Http::get("https://api.papermc.io/v2/projects/paper/versions/{$version}/builds");
                if ($buildsResponse->successful()) {
                    $builds = $buildsResponse->json('builds', []);
                    $latestBuild = end($builds);
                    if ($latestBuild) {
                        $buildNumber = $latestBuild['build'];
                        $downloadName = $latestBuild['downloads']['application']['name'] ?? "paper-{$version}-{$buildNumber}.jar";
                        $url = "https://api.papermc.io/v2/projects/paper/versions/{$version}/builds/{$buildNumber}/downloads/{$downloadName}";
                        $filename = $downloadName;
                    }
                }
                break;

            case 'purpur':
                $url = "https://api.purpurmc.org/v2/purpur/{$version}/latest/download";
                $filename = "purpur-{$version}.jar";
                break;

            case 'velocity':
                $buildsResponse = Http::get("https://api.papermc.io/v2/projects/velocity/versions/{$version}/builds");
                if ($buildsResponse->successful()) {
                    $builds = $buildsResponse->json('builds', []);
                    $latestBuild = end($builds);
                    if ($latestBuild) {
                        $buildNumber = $latestBuild['build'];
                        $downloadName = $latestBuild['downloads']['application']['name'] ?? "velocity-{$version}-{$buildNumber}.jar";
                        $url = "https://api.papermc.io/v2/projects/velocity/versions/{$version}/builds/{$buildNumber}/downloads/{$downloadName}";
                        $filename = $downloadName;
                    }
                }
                break;

            case 'vanilla':
                $manifestResponse = Http::get('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json');
                if ($manifestResponse->successful()) {
                    $versionData = collect($manifestResponse->json('versions', []))
                        ->firstWhere('id', $version);
                    if ($versionData) {
                        $versionDetailResponse = Http::get($versionData['url']);
                        if ($versionDetailResponse->successful()) {
                            $url = $versionDetailResponse->json('downloads.server.url');
                            $filename = "server.jar";
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
                    }
                }
                break;
        }

        if (!$url) {
            return ['error' => 'Could not resolve download URL for this version'];
        }

        return [
            'url' => $url,
            'filename' => $filename,
        ];
    }

    /**
     * Install a specific version on the server.
     */
    public function install(Request $request, Server $server): array
    {
        $request->validate([
            'type' => 'required|string|in:paper,purpur,velocity,vanilla,snapshot,spigot,fabric',
            'version' => 'required|string',
        ]);

        $type = $request->input('type');
        $version = $request->input('version');

        // Get the download URL
        $downloadData = $this->getDownloadUrl(new Request(['type' => $type, 'version' => $version]));

        if (isset($downloadData['error'])) {
            return ['success' => false, 'error' => $downloadData['error']];
        }

        $url = $downloadData['url'];
        $filename = $downloadData['filename'];

        // Delete existing server.jar before downloading new one
        try {
            $this->fileRepository->setServer($server)->deleteFiles('/', ['server.jar']);
        } catch (\Exception $e) {
            // File might not exist, that's fine
        }

        // Use Wings to pull the file to the server (always save as server.jar for consistency)
        $this->fileRepository->setServer($server)->pull($url, '/', ['filename' => 'server.jar', 'foreground' => true]);

        // Update the SERVER_JARFILE variable to server.jar
        $eggVariable = $server->egg->variables()->where('env_variable', 'SERVER_JARFILE')->first();
        if ($eggVariable) {
            \Pterodactyl\Models\ServerVariable::updateOrCreate(
                ['server_id' => $server->id, 'variable_id' => $eggVariable->id],
                ['variable_value' => 'server.jar']
            );
        }

        Activity::event('server:versions.install')
            ->property('name', "{$type} {$version}")
            ->log();

        return [
            'success' => true,
            'filename' => 'server.jar',
            'version' => "{$type} {$version}",
        ];
    }
}
