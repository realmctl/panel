<?php

namespace Realm\Tests\Unit\Http\Middleware;

use Realm\Tests\TestCase;
use Realm\Tests\Traits\Http\RequestMockHelpers;
use Realm\Tests\Traits\Http\MocksMiddlewareClosure;
use Realm\Tests\Assertions\MiddlewareAttributeAssertionsTrait;

abstract class MiddlewareTestCase extends TestCase
{
    use MiddlewareAttributeAssertionsTrait;
    use MocksMiddlewareClosure;
    use RequestMockHelpers;

    /**
     * Setup tests with a mocked request object and normal attributes.
     */
    public function setUp(): void
    {
        parent::setUp();

        $this->buildRequestMock();
    }
}
