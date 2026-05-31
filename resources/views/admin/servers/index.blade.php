@extends('layouts.admin')

@section('title')
    List Servers
@endsection

@section('content-header')
    <h2 class="page-title">Servers</h2>
@endsection

@section('admin-content')
<div class="row">
    <div class="col-lg-12">
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Server List</h3>
                <div class="card-actions">
                    <form action="{{ route('admin.servers') }}" method="GET" class="d-inline-flex align-items-center me-2">
                        <div class="input-group input-group-sm" style="width: 200px;">
                            <input type="text" name="filter[*]" class="form-control" value="{{ request()->input()['filter']['*'] ?? '' }}" placeholder="Search Servers">
                            <button type="submit" class="btn btn-icon"><i class="ti ti-search"></i></button>
                        </div>
                    </form>
                    <a href="{{ route('admin.servers.new') }}" class="btn btn-primary"><i class="ti ti-plus me-1"></i> Create New</a>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-vcenter card-table">
                    <thead>
                        <tr>
                            <th>Server Name</th>
                            <th>UUID</th>
                            <th>Owner</th>
                            <th>Node</th>
                            <th>Connection</th>
                            <th></th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($servers as $server)
                            <tr data-server="{{ $server->uuidShort }}">
                                <td><a href="{{ route('admin.servers.view', $server->id) }}">{{ $server->name }}</a></td>
                                <td><code title="{{ $server->uuid }}">{{ $server->uuid }}</code></td>
                                <td><a href="{{ route('admin.users.view', $server->user->id) }}">{{ $server->user->username }}</a></td>
                                <td><a href="{{ route('admin.nodes.view', $server->node->id) }}">{{ $server->node->name }}</a></td>
                                <td>
                                    <code>{{ $server->allocation->alias }}:{{ $server->allocation->port }}</code>
                                </td>
                                <td class="text-center">
                                    @if($server->isSuspended())
                                        <span class="badge bg-danger">Suspended</span>
                                    @elseif(! $server->isInstalled())
                                        <span class="badge bg-warning">Installing</span>
                                    @else
                                        <span class="badge bg-success">Active</span>
                                    @endif
                                </td>
                                <td class="text-center">
                                    <a class="btn btn-sm btn-default" href="/server/{{ $server->uuidShort }}"><i class="ti ti-tool"></i></a>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
            @if($servers->hasPages())
                <div class="card-footer">
                    <div class="col-md-12 text-center">{!! $servers->appends(['filter' => Request::input('filter')])->render() !!}</div>
                </div>
            @endif
        </div>
    </div>
</div>
@endsection

@section('admin-js')
    <script>
        $('.console-popout').on('click', function (event) {
            event.preventDefault();
            window.open($(this).attr('href'), 'Pterodactyl Console', 'width=800,height=400');
        });
    </script>
@endsection
