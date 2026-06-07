<?php

namespace Realm\Exceptions\Service;

use Illuminate\Http\Response;
use Realm\Exceptions\DisplayException;

class HasActiveServersException extends DisplayException
{
    public function getStatusCode(): int
    {
        return Response::HTTP_BAD_REQUEST;
    }
}
