<?php

namespace Pterodactyl\Http\Controllers\Admin\Settings;

use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;
use Prologue\Alerts\AlertsMessageBag;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Http\Requests\Admin\Settings\EggMappingsFormRequest;
use Pterodactyl\Models\Nest;
use Pterodactyl\Services\Eggs\EggCategoryMappingService;

class MappingsController extends Controller
{
    public function __construct(
        private AlertsMessageBag $alert,
        private EggCategoryMappingService $mappingService,
    ) {
    }

    public function index(): View
    {
        return view('admin.settings.mappings', [
            'categories' => $this->mappingService->getCategoryDefinitions(),
            'mappings' => $this->mappingService->getMappingsGroupedByCategory(),
            'nests' => Nest::query()->with('eggs')->orderBy('name')->get(),
        ]);
    }

    public function update(EggMappingsFormRequest $request): RedirectResponse
    {
        try {
            $this->mappingService->syncMappings($request->input('mappings', []));
        } catch (DisplayException $exception) {
            $this->alert->danger($exception->getMessage())->flash();

            return redirect()->route('admin.settings.mappings');
        }

        $this->alert->success('Egg mappings have been updated successfully.')->flash();

        return redirect()->route('admin.settings.mappings');
    }
}
