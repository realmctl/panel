<?php

namespace Pterodactyl\Http\Controllers\Api\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Pterodactyl\Exceptions\Model\DataValidationException;
use Pterodactyl\Exceptions\Service\Egg\Variable\BadValidationRuleException;
use Pterodactyl\Exceptions\Service\Egg\Variable\ReservedVariableNameException;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Http\Requests\Admin\Egg\EggVariableFormRequest;
use Pterodactyl\Models\Egg;
use Pterodactyl\Models\EggVariable;
use Pterodactyl\Contracts\Repository\EggRepositoryInterface;
use Pterodactyl\Contracts\Repository\EggVariableRepositoryInterface;
use Pterodactyl\Services\Eggs\Variables\VariableCreationService;
use Pterodactyl\Services\Eggs\Variables\VariableUpdateService;

class EggVariableController extends Controller
{
    public function __construct(
        private VariableCreationService $creationService,
        private VariableUpdateService $updateService,
        private EggRepositoryInterface $repository,
        private EggVariableRepositoryInterface $variableRepository,
    ) {
    }

    public function index(int $egg): JsonResponse
    {
        $egg = $this->repository->getWithVariables($egg);

        return response()->json([
            'egg' => [
                'id' => $egg->id,
                'name' => $egg->name,
                'nest_id' => $egg->nest_id,
            ],
            'variables' => $egg->variables->map(fn (EggVariable $variable) => [
                'id' => $variable->id,
                'name' => $variable->name,
                'description' => $variable->description,
                'env_variable' => $variable->env_variable,
                'default_value' => $variable->default_value,
                'user_viewable' => (bool) $variable->user_viewable,
                'user_editable' => (bool) $variable->user_editable,
                'rules' => $variable->rules,
            ])->values(),
        ]);
    }

    /**
     * @throws DataValidationException
     * @throws BadValidationRuleException
     * @throws ReservedVariableNameException
     */
    public function store(EggVariableFormRequest $request, Egg $egg): JsonResponse
    {
        $this->creationService->handle($egg->id, $request->normalize());

        return response()->json([
            'success' => true,
            'message' => trans('admin/nests.variables.notices.variable_created'),
        ], 201);
    }

    public function update(EggVariableFormRequest $request, Egg $egg, EggVariable $variable): JsonResponse
    {
        $this->updateService->handle($variable, $request->normalize());

        return response()->json([
            'success' => true,
            'message' => trans('admin/nests.variables.notices.variable_updated', [
                'variable' => htmlspecialchars($variable->name),
            ]),
        ]);
    }

    public function destroy(int $egg, EggVariable $variable): Response
    {
        $this->variableRepository->delete($variable->id);

        return response('', 204);
    }
}
