<?php

namespace Pterodactyl\Http\Controllers\Api\Admin;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Exceptions\Model\DataValidationException;
use Pterodactyl\Exceptions\Repository\RecordNotFoundException;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Http\Requests\Admin\NewUserFormRequest;
use Pterodactyl\Http\Requests\Admin\UserFormRequest;
use Pterodactyl\Models\User;
use Pterodactyl\Services\Users\UserCreationService;
use Pterodactyl\Services\Users\UserDeletionService;
use Pterodactyl\Services\Users\UserUpdateService;
use Pterodactyl\Traits\Helpers\AvailableLanguages;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;
use Throwable;

class UserController extends Controller
{
    use AvailableLanguages;

    public function __construct(
        private UserCreationService $creationService,
        private UserDeletionService $deletionService,
        private UserUpdateService $updateService,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $paginator = QueryBuilder::for(
            User::query()->select('users.*')
                ->selectRaw('COUNT(DISTINCT(subusers.id)) as subuser_of_count')
                ->selectRaw('COUNT(DISTINCT(servers.id)) as servers_count')
                ->leftJoin('subusers', 'subusers.user_id', '=', 'users.id')
                ->leftJoin('servers', 'servers.owner_id', '=', 'users.id')
                ->groupBy('users.id')
        )
            ->allowedFilters([
                AllowedFilter::partial('email'),
                AllowedFilter::partial('username'),
                AllowedFilter::partial('uuid'),
            ])
            ->defaultSort('-root_admin')
            ->allowedSorts(['id', 'uuid'])
            ->paginate(50, ['*'], 'page', $request->integer('page', 1));

        return response()->json([
            'users' => collect($paginator->items())->map(fn (User $user) => [
                'id' => $user->id,
                'email' => $user->email,
                'username' => $user->username,
                'name_first' => $user->name_first,
                'name_last' => $user->name_last,
                'uuid' => $user->uuid,
                'root_admin' => (bool) $user->root_admin,
                'use_totp' => (bool) $user->use_totp,
                'servers_count' => (int) $user->servers_count,
                'subuser_of_count' => (int) $user->subuser_of_count,
                'gravatar_hash' => md5(strtolower($user->email)),
            ])->values(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function create(): JsonResponse
    {
        return response()->json([
            'languages' => $this->getAvailableLanguages(true),
            'default_language' => config('app.locale'),
        ]);
    }

    /**
     * @throws Exception
     * @throws Throwable
     */
    public function store(NewUserFormRequest $request): JsonResponse
    {
        $user = $this->creationService->handle($request->normalize());

        return response()->json([
            'success' => true,
            'message' => trans('admin/user.notices.account_created'),
            'user' => ['id' => $user->id],
        ], 201);
    }

    public function show(User $user): JsonResponse
    {
        $serversCount = $user->servers()->count();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'username' => $user->username,
                'name_first' => $user->name_first,
                'name_last' => $user->name_last,
                'language' => $user->language,
                'root_admin' => (bool) $user->root_admin,
                'use_totp' => (bool) $user->use_totp,
                'uuid' => $user->uuid,
                'servers_count' => $serversCount,
                'gravatar_hash' => md5(strtolower($user->email)),
            ],
            'languages' => $this->getAvailableLanguages(true),
            'can_delete' => $serversCount === 0 && !request()->user()?->is($user),
        ]);
    }

    /**
     * @throws DataValidationException
     * @throws RecordNotFoundException
     */
    public function update(UserFormRequest $request, User $user): JsonResponse
    {
        $this->updateService
            ->setUserLevel(User::USER_LEVEL_ADMIN)
            ->handle($user, $request->normalize());

        return response()->json([
            'success' => true,
            'message' => trans('admin/user.notices.account_updated'),
        ]);
    }

    /**
     * @throws DisplayException
     */
    public function destroy(Request $request, User $user): Response
    {
        if ($request->user()->is($user)) {
            throw new DisplayException(__('admin/user.exceptions.delete_self'));
        }

        $this->deletionService->handle($user);

        return response('', 204);
    }

    public function search(Request $request): JsonResponse
    {
        $users = QueryBuilder::for(User::query())
            ->allowedFilters([AllowedFilter::partial('email')])
            ->paginate(25);

        return response()->json([
            'users' => collect($users->items())->map(fn (User $user) => [
                'id' => $user->id,
                'email' => $user->email,
                'username' => $user->username,
                'name_first' => $user->name_first,
                'name_last' => $user->name_last,
            ])->values(),
        ]);
    }
}
