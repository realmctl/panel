<?php

namespace Pterodactyl\Http\Controllers\Admin;

use Pterodactyl\Exceptions\Repository\RecordNotFoundException;
use Throwable;
use Exception;
use Illuminate\View\View;
use Pterodactyl\Models\Location;
use Illuminate\Http\RedirectResponse;
use Prologue\Alerts\AlertsMessageBag;
use Illuminate\View\Factory as ViewFactory;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Http\Requests\Admin\LocationFormRequest;
use Pterodactyl\Services\Locations\LocationUpdateService;
use Pterodactyl\Services\Locations\LocationCreationService;
use Pterodactyl\Services\Locations\LocationDeletionService;
use Pterodactyl\Contracts\Repository\LocationRepositoryInterface;

class LocationController extends Controller
{
    /**
     * LocationController constructor.
     */
    public function __construct(
        protected AlertsMessageBag $alert,
        protected LocationCreationService $creationService,
        protected LocationDeletionService $deletionService,
        protected LocationRepositoryInterface $repository,
        protected LocationUpdateService $updateService,
        protected ViewFactory $view,
    ) {
    }

    /**
     * Return the location overview page.
     */
    public function index(): View
    {
        $intendedAction = request()->input('intended_action');
        if ($intendedAction === 'create_server') {
            session()->put('intended_action', 'create_server');
        }

        return view('admin.locations.index', [
            'locations' => $this->repository->getAllWithDetails(),
            'intended_action' => $intendedAction,
        ]);
    }

    public function createLocation(): View
    {
        session()->put('intended_action', 'create_server');
        return view('admin.locations.new');
    }

    /**
     * Return the location view page.
     *
     * @throws RecordNotFoundException
     */
    public function view(int $id): View
    {
        return view('admin.locations.view', [
            'location' => $this->repository->getWithNodes($id),
        ]);
    }

    /**
     * Handle request to create new location.
     *
     * @throws Throwable
     */
    public function create(LocationFormRequest $request): RedirectResponse
    {
        $intendedAction = $request->input('intended_action') ?? session('intended_action');
        $location = $this->creationService->handle($request->normalize());
        $this->alert->success('Location was created successfully.')->flash();

        if ($intendedAction === 'create_server') {
            session()->forget('intended_action');
            return redirect()->route('admin.nodes.new')
                ->with('success', trans('admin/server.alerts.location_ready'));
        }

        return redirect()->route('admin.locations.view', $location->id);
    }

    /**
     * Handle request to update or delete location.
     *
     * @throws Throwable
     */
    public function update(LocationFormRequest $request, Location $location): RedirectResponse
    {
        if ($request->input('action') === 'delete') {
            return $this->delete($location);
        }

        $this->updateService->handle($location->id, $request->normalize());
        $this->alert->success('Location was updated successfully.')->flash();

        return redirect()->route('admin.locations.view', $location->id);
    }

    /**
     * Delete a location from the system.
     *
     * @throws Exception
     * @throws DisplayException
     */
    public function delete(Location $location): RedirectResponse
    {
        try {
            $this->deletionService->handle($location->id);

            return redirect()->route('admin.locations');
        } catch (DisplayException $ex) {
            $this->alert->danger($ex->getMessage())->flash();
        }

        return redirect()->route('admin.locations.view', $location->id);
    }
}
