<?php

namespace Realm\Http\Requests\Admin;

use Realm\Models\BackupDestination;

class BackupDestinationFormRequest extends AdminFormRequest
{
    /**
     * Set up the validation rules to use for these requests.
     */
    public function rules(): array
    {
        if ($this->method() === 'PATCH') {
            return BackupDestination::getRulesForUpdate($this->route()->parameter('backup_destination')->id); // @phpstan-ignore property.nonObject
        }

        return BackupDestination::getRules();
    }
}
