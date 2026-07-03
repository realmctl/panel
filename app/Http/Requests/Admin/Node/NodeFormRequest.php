<?php

namespace Realm\Http\Requests\Admin\Node;

use Realm\Rules\Fqdn;
use Realm\Models\Node;
use Realm\Http\Requests\Admin\AdminFormRequest;

class NodeFormRequest extends AdminFormRequest
{
    /**
     * Get rules to apply to data in this request.
     */
    /**
     * Treat an empty backup adapter selection as "use the Panel default" by
     * normalizing it to null before validation, since the enum rule rejects an
     * empty string.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('backup_adapter') && $this->input('backup_adapter') === '') {
            $this->merge(['backup_adapter' => null]);
        }
    }

    public function rules(): array
    {
        if ($this->method() === 'PATCH') {
            return Node::getRulesForUpdate($this->route()->parameter('node'));
        }

        $data = Node::getRules();
        $data['fqdn'][] = Fqdn::make('scheme');

        return $data;
    }
}
