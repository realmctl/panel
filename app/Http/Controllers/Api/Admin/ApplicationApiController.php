<?php

namespace Realm\Http\Controllers\Api\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Contracts\Encryption\Encrypter;
use Realm\Exceptions\Model\DataValidationException;
use Realm\Http\Controllers\Controller;
use Realm\Http\Requests\Admin\Api\StoreApplicationApiKeyRequest;
use Realm\Models\ApiKey;
use Realm\Services\Acl\Api\AdminAcl;
use Realm\Services\Api\KeyCreationService;
use ReflectionException;

class ApplicationApiController extends Controller
{
    public function __construct(
        private Encrypter $encrypter,
        private KeyCreationService $keyCreationService,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $keys = ApiKey::query()
            ->where('key_type', ApiKey::TYPE_APPLICATION)
            ->with('user:id,username')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (ApiKey $key) => $this->transformKey($key, $request));

        return response()->json(['keys' => $keys]);
    }

    /**
     * @throws ReflectionException
     */
    public function create(): JsonResponse
    {
        $resources = AdminAcl::getResourceList();
        sort($resources);

        return response()->json([
            'resources' => $resources,
            'permissions' => [
                'read' => AdminAcl::READ,
                'readWrite' => AdminAcl::READ | AdminAcl::WRITE,
                'none' => AdminAcl::NONE,
            ],
        ]);
    }

    /**
     * @throws DataValidationException
     */
    public function store(StoreApplicationApiKeyRequest $request): JsonResponse
    {
        $key = $this->keyCreationService
            ->setKeyType(ApiKey::TYPE_APPLICATION)
            ->handle([
                'memo' => $request->input('memo'),
                'user_id' => $request->user()->id,
            ], $request->getKeyPermissions());

        $key->load('user:id,username');

        return response()->json([
            'success' => true,
            'message' => 'A new application API key has been generated for your account.',
            'key' => $this->transformKey($key, $request),
            'secret_token' => $key->identifier . $this->encrypter->decrypt($key->token),
        ]);
    }

    public function delete(string $identifier): JsonResponse
    {
        ApiKey::query()
            ->where('key_type', ApiKey::TYPE_APPLICATION)
            ->where('identifier', $identifier)
            ->delete();

        return response()->json(['success' => true]);
    }

    private function transformKey(ApiKey $key, Request $request): array
    {
        $isOwner = $request->user()->is($key->user);

        return [
            'identifier' => $key->identifier,
            'display_key' => $isOwner
                ? $key->identifier . $this->encrypter->decrypt($key->token)
                : $key->identifier . '****',
            'memo' => $key->memo,
            'last_used_at' => $key->last_used_at?->toIso8601String(),
            'created_at' => $key->created_at?->toIso8601String(),
            'user' => $key->user ? [
                'id' => $key->user->id,
                'username' => $key->user->username,
            ] : null,
        ];
    }
}
