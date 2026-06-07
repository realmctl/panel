<?php

namespace Realm\Http\Controllers\Api\Admin;

use Illuminate\Http\JsonResponse;
use Realm\Exceptions\Model\DataValidationException;
use Realm\Exceptions\Service\Egg\InvalidCopyFromException;
use Realm\Http\Controllers\Controller;
use Realm\Http\Requests\Admin\Egg\EggScriptFormRequest;
use Realm\Models\Egg;
use Realm\Contracts\Repository\EggRepositoryInterface;
use Realm\Services\Eggs\Scripts\InstallScriptService;

class EggScriptController extends Controller
{
    public function __construct(
        private EggRepositoryInterface $repository,
        private InstallScriptService $installScriptService,
    ) {
    }

    public function show(int $egg): JsonResponse
    {
        $egg = $this->repository->getWithCopyAttributes($egg);

        $copyFromOptions = $this->repository->findWhere([
            ['copy_script_from', '=', null],
            ['nest_id', '=', $egg->nest_id],
            ['id', '!=', $egg->id],
        ]);

        $relyOnScript = $this->repository->findWhere([
            ['copy_script_from', '=', $egg->id],
        ]);

        return response()->json([
            'egg' => [
                'id' => $egg->id,
                'name' => $egg->name,
                'nest_id' => $egg->nest_id,
                'script_install' => $egg->script_install,
                'script_container' => $egg->script_container,
                'script_entry' => $egg->script_entry,
                'copy_script_from' => $egg->copy_script_from,
                'copy_from' => $egg->scriptFrom ? [
                    'id' => $egg->scriptFrom->id,
                    'name' => $egg->scriptFrom->name,
                ] : null,
            ],
            'copy_from_options' => collect($copyFromOptions)->map(fn (Egg $opt) => [
                'id' => $opt->id,
                'name' => $opt->name,
            ])->values(),
            'rely_on_script' => collect($relyOnScript)->map(fn (Egg $rely) => [
                'id' => $rely->id,
                'name' => $rely->name,
            ])->values(),
        ]);
    }

    /**
     * @throws DataValidationException
     * @throws InvalidCopyFromException
     */
    public function update(EggScriptFormRequest $request, Egg $egg): JsonResponse
    {
        $this->installScriptService->handle($egg, $request->normalize());

        return response()->json([
            'success' => true,
            'message' => trans('admin/nests.eggs.notices.script_updated'),
        ]);
    }
}
