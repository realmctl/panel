<?php

namespace Realm\Services\Nodes;

use Realm\Exceptions\Model\DataValidationException;
use Ramsey\Uuid\Uuid;
use Illuminate\Support\Str;
use Realm\Models\Node;
use Illuminate\Contracts\Encryption\Encrypter;
use Realm\Contracts\Repository\NodeRepositoryInterface;

class NodeCreationService
{
    /**
     * NodeCreationService constructor.
     */
    public function __construct(protected NodeRepositoryInterface $repository)
    {
    }

    /**
     * Create a new node on the panel.
     *
     * @throws DataValidationException
     */
    public function handle(array $data): Node
    {
        $data['uuid'] = Uuid::uuid4()->toString();
        $data['daemon_token'] = app(Encrypter::class)->encrypt(Str::random(Node::DAEMON_TOKEN_LENGTH));
        $data['daemon_token_id'] = Str::random(Node::DAEMON_TOKEN_ID_LENGTH);

        return $this->repository->create($data, true, true);
    }
}
