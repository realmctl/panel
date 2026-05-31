@php
    /** @var \Pterodactyl\Models\Server $server */
    $router = app('router');
@endphp
<ul class="nav nav-tabs mb-3">
    <li class="nav-item">
        <a class="nav-link{{ $router->currentRouteNamed('admin.servers.view') ? ' active' : '' }}" href="{{ route('admin.servers.view', $server->id) }}">
            <i class="ti ti-info-circle me-1"></i> About
        </a>
    </li>
    @if($server->isInstalled())
        <li class="nav-item">
            <a class="nav-link{{ $router->currentRouteNamed('admin.servers.view.details') ? ' active' : '' }}" href="{{ route('admin.servers.view.details', $server->id) }}">
                <i class="ti ti-file-text me-1"></i> Details
            </a>
        </li>
        <li class="nav-item">
            <a class="nav-link{{ $router->currentRouteNamed('admin.servers.view.build') ? ' active' : '' }}" href="{{ route('admin.servers.view.build', $server->id) }}">
                <i class="ti ti-settings me-1"></i> Build
            </a>
        </li>
        <li class="nav-item">
            <a class="nav-link{{ $router->currentRouteNamed('admin.servers.view.startup') ? ' active' : '' }}" href="{{ route('admin.servers.view.startup', $server->id) }}">
                <i class="ti ti-rocket me-1"></i> Startup
            </a>
        </li>
        <li class="nav-item">
            <a class="nav-link{{ $router->currentRouteNamed('admin.servers.view.database') ? ' active' : '' }}" href="{{ route('admin.servers.view.database', $server->id) }}">
                <i class="ti ti-database me-1"></i> Database
            </a>
        </li>
        <li class="nav-item">
            <a class="nav-link{{ $router->currentRouteNamed('admin.servers.view.mounts') ? ' active' : '' }}" href="{{ route('admin.servers.view.mounts', $server->id) }}">
                <i class="ti ti-folder me-1"></i> Mounts
            </a>
        </li>
    @endif
    <li class="nav-item">
        <a class="nav-link{{ $router->currentRouteNamed('admin.servers.view.manage') ? ' active' : '' }}" href="{{ route('admin.servers.view.manage', $server->id) }}">
            <i class="ti ti-tool me-1"></i> Manage
        </a>
    </li>
    <li class="nav-item">
        <a class="nav-link text-danger{{ $router->currentRouteNamed('admin.servers.view.delete') ? ' active' : '' }}" href="{{ route('admin.servers.view.delete', $server->id) }}">
            <i class="ti ti-trash me-1"></i> Delete
        </a>
    </li>
    <li class="nav-item ms-auto">
        <a class="nav-link" href="/server/{{ $server->uuidShort }}" target="_blank">
            <i class="ti ti-external-link me-1"></i> Open
        </a>
    </li>
</ul>
