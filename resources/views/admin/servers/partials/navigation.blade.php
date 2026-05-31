@php
    /** @var \Pterodactyl\Models\Server $server */
    $router = app('router');
@endphp
<ul class="nav nav-tabs mb-3">
    <li class="nav-item">
        <a class="nav-link{{ $router->currentRouteNamed('admin.servers.view') ? ' active' : '' }}" href="{{ route('admin.servers.view', $server->id) }}">About</a>
    </li>
    @if($server->isInstalled())
        <li class="nav-item">
            <a class="nav-link{{ $router->currentRouteNamed('admin.servers.view.details') ? ' active' : '' }}" href="{{ route('admin.servers.view.details', $server->id) }}">Details</a>
        </li>
        <li class="nav-item">
            <a class="nav-link{{ $router->currentRouteNamed('admin.servers.view.build') ? ' active' : '' }}" href="{{ route('admin.servers.view.build', $server->id) }}">Build Configuration</a>
        </li>
        <li class="nav-item">
            <a class="nav-link{{ $router->currentRouteNamed('admin.servers.view.startup') ? ' active' : '' }}" href="{{ route('admin.servers.view.startup', $server->id) }}">Startup</a>
        </li>
        <li class="nav-item">
            <a class="nav-link{{ $router->currentRouteNamed('admin.servers.view.database') ? ' active' : '' }}" href="{{ route('admin.servers.view.database', $server->id) }}">Database</a>
        </li>
        <li class="nav-item">
            <a class="nav-link{{ $router->currentRouteNamed('admin.servers.view.mounts') ? ' active' : '' }}" href="{{ route('admin.servers.view.mounts', $server->id) }}">Mounts</a>
        </li>
    @endif
    <li class="nav-item">
        <a class="nav-link{{ $router->currentRouteNamed('admin.servers.view.manage') ? ' active' : '' }}" href="{{ route('admin.servers.view.manage', $server->id) }}">Manage</a>
    </li>
    <li class="nav-item">
        <a class="nav-link text-danger{{ $router->currentRouteNamed('admin.servers.view.delete') ? ' active' : '' }}" href="{{ route('admin.servers.view.delete', $server->id) }}">Delete</a>
    </li>
    <li class="nav-item ms-auto">
        <a class="nav-link" href="/server/{{ $server->uuidShort }}" target="_blank"><i class="ti ti-external-link"></i></a>
    </li>
</ul>
