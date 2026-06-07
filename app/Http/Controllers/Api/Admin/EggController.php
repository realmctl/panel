<?php

namespace Realm\Http\Controllers\Api\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Realm\Exceptions\Model\DataValidationException;
use Realm\Exceptions\Service\Egg\HasChildrenException;
use Realm\Exceptions\Service\Egg\NoParentConfigurationFoundException;
use Realm\Exceptions\Service\HasActiveServersException;
use Realm\Http\Controllers\Controller;
use Realm\Http\Requests\Admin\Egg\EggFormRequest;
use Realm\Http\Requests\Admin\Egg\EggImportFormRequest;
use Realm\Models\Egg;
use Realm\Contracts\Repository\EggRepositoryInterface;
use Realm\Contracts\Repository\NestRepositoryInterface;
use Realm\Services\Eggs\EggCreationService;
use Realm\Services\Eggs\EggDeletionService;
use Realm\Services\Eggs\EggUpdateService;
use Realm\Services\Eggs\Sharing\EggExporterService;
use Realm\Services\Eggs\Sharing\EggImporterService;
use Realm\Services\Eggs\Sharing\EggUpdateImporterService;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class EggController extends Controller
{
    public function __construct(
        private EggCreationService $creationService,
        private EggDeletionService $deletionService,
        private EggRepositoryInterface $repository,
        private EggUpdateService $updateService,
        private NestRepositoryInterface $nestRepository,
        private EggExporterService $exporterService,
        private EggImporterService $importerService,
        private EggUpdateImporterService $updateImporterService,
    ) {
    }

    public function create(): JsonResponse
    {
        $nests = $this->nestRepository->getWithEggs();

        return response()->json([
            'nests' => $nests->map(fn ($nest) => [
                'id' => $nest->id,
                'name' => $nest->name,
                'author' => $nest->author,
                'eggs' => $nest->eggs->map(fn (Egg $egg) => [
                    'id' => $egg->id,
                    'name' => $egg->name,
                    'author' => $egg->author,
                ])->values(),
            ])->values(),
        ]);
    }

    /**
     * @throws DataValidationException
     * @throws NoParentConfigurationFoundException
     */
    public function store(EggFormRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['docker_images'] = $this->normalizeDockerImages($data['docker_images'] ?? null);

        $egg = $this->creationService->handle($data);

        return response()->json([
            'success' => true,
            'message' => trans('admin/nests.eggs.notices.egg_created'),
            'egg' => ['id' => $egg->id],
        ], 201);
    }

    public function show(Egg $egg): JsonResponse
    {
        $egg->load('nest.eggs');

        return response()->json([
            'egg' => $this->transformEgg($egg),
            'nest_eggs' => $egg->nest->eggs->map(fn (Egg $nestEgg) => [
                'id' => $nestEgg->id,
                'name' => $nestEgg->name,
                'author' => $nestEgg->author,
            ])->values(),
        ]);
    }

    /**
     * @throws DataValidationException
     * @throws NoParentConfigurationFoundException
     */
    public function update(EggFormRequest $request, Egg $egg): JsonResponse
    {
        $data = $request->validated();
        $data['docker_images'] = $this->normalizeDockerImages($data['docker_images'] ?? null);

        $this->updateService->handle($egg, $data);

        return response()->json([
            'success' => true,
            'message' => trans('admin/nests.eggs.notices.updated'),
        ]);
    }

    /**
     * @throws HasChildrenException
     * @throws HasActiveServersException
     */
    public function destroy(Egg $egg): JsonResponse
    {
        $nestId = $egg->nest_id;
        $this->deletionService->handle($egg->id);

        return response()->json(['success' => true, 'nest_id' => $nestId]);
    }

    public function export(Egg $egg): SymfonyResponse
    {
        $filename = trim(preg_replace('/\W/', '-', kebab_case($egg->name)), '-');

        return response($this->exporterService->handle($egg->id), 200, [
            'Content-Transfer-Encoding' => 'binary',
            'Content-Description' => 'File Transfer',
            'Content-Disposition' => 'attachment; filename=egg-' . $filename . '.json',
            'Content-Type' => 'application/json',
        ]);
    }

    public function import(EggImportFormRequest $request): JsonResponse
    {
        $egg = $this->importerService->handle($request->file('import_file'), $request->input('import_to_nest'));

        return response()->json([
            'success' => true,
            'message' => trans('admin/nests.eggs.notices.imported'),
            'egg' => ['id' => $egg->id],
        ], 201);
    }

    public function importUpdate(EggImportFormRequest $request, Egg $egg): JsonResponse
    {
        $this->updateImporterService->handle($egg, $request->file('import_file'));

        return response()->json([
            'success' => true,
            'message' => trans('admin/nests.eggs.notices.updated_via_import'),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function transformEgg(Egg $egg): array
    {
        $images = array_map(
            fn ($key, $value) => $key === $value ? $value : "$key|$value",
            array_keys($egg->docker_images ?? []),
            $egg->docker_images ?? [],
        );

        return [
            'id' => $egg->id,
            'nest_id' => $egg->nest_id,
            'uuid' => $egg->uuid,
            'name' => $egg->name,
            'author' => $egg->author,
            'description' => $egg->description,
            'background' => $egg->background,
            'docker_images' => implode("\n", $images),
            'force_outgoing_ip' => (bool) $egg->force_outgoing_ip,
            'startup' => $egg->startup,
            'features' => $egg->features ?? [],
            'config_from' => $egg->config_from,
            'config_stop' => $egg->config_stop,
            'config_logs' => !is_null($egg->config_logs)
                ? json_encode(json_decode($egg->config_logs), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
                : '',
            'config_files' => !is_null($egg->config_files)
                ? json_encode(json_decode($egg->config_files), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
                : '',
            'config_startup' => !is_null($egg->config_startup)
                ? json_encode(json_decode($egg->config_startup), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
                : '',
        ];
    }

    protected function normalizeDockerImages(?string $input = null): array
    {
        $data = array_map(fn ($value) => trim($value), explode("\n", $input ?? ''));

        $images = [];
        foreach ($data as $value) {
            if ($value === '') {
                continue;
            }

            $parts = explode('|', $value, 2);
            $images[$parts[0]] = empty($parts[1]) ? $parts[0] : $parts[1];
        }

        return $images;
    }
}
