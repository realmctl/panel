<?php

namespace Realm\Http\Middleware\Api\Client;

use Closure;
use Illuminate\Http\Request;
use Realm\Models\Subuser;
use Realm\Models\Server;
use Illuminate\Routing\Middleware\SubstituteBindings;

class SubstituteClientBindings extends SubstituteBindings
{
    /**
     * @param Request $request
     */
    public function handle($request, Closure $next): mixed
    {
        // Override default behavior of the model binding to use a specific table
        // column rather than the default 'id'.
        $this->router->bind('server', function ($value) {
            return Server::query()
                ->when(
                    str_starts_with($value, 'serv_'),
                    fn ($builder) => $builder->whereIdentifier($value),
                    fn ($builder) => $builder->where(strlen($value) === 8 ? 'uuidShort' : 'uuid', $value)
                )
                ->firstOrFail();
        });

        $this->router->bind('user', function ($value, $route) {
            /** @var Subuser $match */
            $match = $route->parameter('server')
                ->subusers()
                ->whereRelation('user', 'uuid', '=', $value)
                ->firstOrFail();

            return $match->user;
        });

        return parent::handle($request, $next);
    }
}
