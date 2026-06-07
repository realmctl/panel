<?php

namespace Realm\Models\Attributes;

use Attribute;

#[Attribute(Attribute::TARGET_CLASS)]
readonly class Identifiable
{
    public function __construct(public string $prefix, public string $column = 'uuid')
    {
    }
}
