<?php

namespace Realm\Exceptions\Service\Backup;

use Realm\Exceptions\DisplayException;

class BackupAdapterNotConfiguredException extends DisplayException
{
    public function __construct(string $adapter, array $missing)
    {
        parent::__construct(sprintf(
            'The [%s] backup adapter is missing required configuration: %s.',
            $adapter,
            implode(', ', $missing)
        ));
    }
}
