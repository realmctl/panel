@extends('layouts.admin')

@section('title')
    Servers
@endsection

@section('content-header')
    <h2 class="page-title">Servers</h2>
@endsection

@section('admin-content')
    <div class="card">
        <div class="card-header">
            <h3 class="card-title">Server List</h3>
            <div class="card-actions">
                <form action="{{ route('admin.servers') }}" method="GET" class="d-inline-flex align-items-center me-2">
                    <div class="input-group input-group-sm" style="width: 200px;">
                        <input type="text" name="filter[*]" class="form-control" value="{{ request()->input()['filter']['*'] ?? '' }}" placeholder="Search...">
                        <button type="submit" class="btn btn-icon"><i class="ti ti-search"></i></button>
                    </div>
                </form>
                <a href="{{ route('admin.servers.new') }}" class="btn btn-primary">
                    <i class="ti ti-plus me-1"></i> Create New
                </a>
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
                        <th>Status</th>
                        <th class="w-1"></th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($servers as $server)
                        <tr>
                            <td><a href="{{ route('admin.servers.view', $server->id) }}">{{ $server->name }}</a></td>
                            <td><code title="{{ $server->uuid }}">{{ $server->uuidShort }}</code></td>
                            <td><a href="{{ route('admin.users.view', $server->user->id) }}">{{ $server->user->username }}</a></td>
                            <td><a href="{{ route('admin.nodes.view', $server->node->id) }}">{{ $server->node->name }}</a></td>
                            <td><code>{{ $server->allocation->alias }}:{{ $server->allocation->port }}</code></td>
                            <td>
                                @if($server->isSuspended())
                                    <span class="badge bg-danger-lt">Suspended</span>
                                @elseif(! $server->isInstalled())
                                    <span class="badge bg-warning-lt">Installing</span>
                                @else
                                    <span class="badge bg-success-lt">Active</span>
                                @endif
                            </td>
                            <td>
                                <a class="btn btn-sm btn-ghost-primary" href="/server/{{ $server->uuidShort }}" target="_blank" title="Open">
                                    <i class="ti ti-external-link"></i>
                                </a>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        @if($servers->hasPages())
            <div class="card-footer d-flex align-items-center">
                {!! $servers->appends(['filter' => Request::input('filter')])->render() !!}
            </div>
        @endif
    </div>
@endsection
