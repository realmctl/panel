<?php

namespace Realm\Transformers\Api\Application;

use Realm\Exceptions\Transformer\InvalidTransformerLevelException;
use League\Fractal\Resource\Item;
use Realm\Models\EggVariable;
use Realm\Models\ServerVariable;
use League\Fractal\Resource\NullResource;
use Realm\Services\Acl\Api\AdminAcl;

class ServerVariableTransformer extends BaseTransformer
{
    /**
     * List of resources that can be included.
     */
    protected array $availableIncludes = ['parent'];

    /**
     * Return the resource name for the JSONAPI output.
     */
    public function getResourceName(): string
    {
        return ServerVariable::RESOURCE_NAME;
    }

    /**
     * Return a generic transformed server variable array.
     */
    public function transform(EggVariable $variable): array
    {
        return $variable->toArray();
    }

    /**
     * Return the parent service variable data.
     *
     * @throws InvalidTransformerLevelException
     */
    public function includeParent(EggVariable $variable): Item|NullResource
    {
        if (!$this->authorize(AdminAcl::RESOURCE_EGGS)) {
            return $this->null();
        }

        $variable->loadMissing('variable');

        return $this->item($variable->getRelation('variable'), $this->makeTransformer(EggVariableTransformer::class), 'variable');
    }
}
