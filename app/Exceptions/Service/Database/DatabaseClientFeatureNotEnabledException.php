<?php

namespace Realm\Exceptions\Service\Database;

use Realm\Exceptions\RealmException;

class DatabaseClientFeatureNotEnabledException extends RealmException
{
    public function __construct()
    {
        parent::__construct('Client database creation is not enabled in this Panel.');
    }
}
