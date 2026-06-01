@extends('layouts.admin')

@section('title')
    Server — {{ $server->name }}
@endsection

@section('content-header')
    <h2 class="page-title">{{ $server->name }}</h2>
@endsection

@section('admin-content')
@include('admin.servers.partials.navigation')
<div class="row">
    <div class="col-lg-8">
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Information</h3>
            </div>
            <div class="table-responsive">
                <table class="table table-vcenter card-table">
                    <tbody>
                        <tr>
                            <td>Internal Identifier</td>
                            <td><code>{{ $server->id }}</code></td>
                        </tr>
                        <tr>
                            <td>External Identifier</td>
                            @if(is_null($server->external_id))
                                <td><span class="badge bg-secondary-lt">Not Set</span></td>
                            @else
                                <td><code>{{ $server->external_id }}</code></td>
                            @endif
                        </tr>
                        <tr>
                            <td>UUID / Docker Container ID</td>
                            <td><code>{{ $server->uuid }}</code></td>
                        </tr>
                        <tr>
                            <td>Current Egg</td>
                            <td>
                                <a href="{{ route('admin.nests.view', $server->nest_id) }}">{{ $server->nest->name }}</a> ::
                                <a href="{{ route('admin.nests.egg.view', $server->egg_id) }}">{{ $server->egg->name }}</a>
                            </td>
                        </tr>
                        <tr>
                            <td>Server Name</td>
                            <td>{{ $server->name }}</td>
                        </tr>
                        <tr>
                            <td>CPU Limit</td>
                            <td>
                                @if($server->cpu === 0)
                                    <code>Unlimited</code>
                                @else
                                    <code>{{ $server->cpu }}%</code>
                                @endif
                            </td>
                        </tr>
                        <tr>
                            <td>CPU Pinning</td>
                            <td>
                                @if($server->threads != null)
                                    <code>{{ $server->threads }}</code>
                                @else
                                    <span class="badge bg-secondary-lt">Not Set</span>
                                @endif
                            </td>
                        </tr>
                        <tr>
                            <td>Memory</td>
                            <td>
                                @if($server->memory === 0)
                                    <code>Unlimited</code>
                                @else
                                    <code>{{ $server->memory }}MiB</code>
                                @endif
                                /
                                @if($server->swap === 0)
                                    <code data-toggle="tooltip" data-placement="top" title="Swap Space">Not Set</code>
                                @elseif($server->swap === -1)
                                    <code data-toggle="tooltip" data-placement="top" title="Swap Space">Unlimited</code>
                                @else
                                    <code data-toggle="tooltip" data-placement="top" title="Swap Space"> {{ $server->swap }}MiB</code>
                                @endif
                            </td>
                        </tr>
                        <tr>
                            <td>Disk Space</td>
                            <td>
                                @if($server->disk === 0)
                                    <code>Unlimited</code>
                                @else
                                    <code>{{ $server->disk }}MiB</code>
                                @endif
                            </td>
                        </tr>
                        <tr>
                            <td>Block IO Weight</td>
                            <td><code>{{ $server->io }}</code></td>
                        </tr>
                        <tr>
                            <td>Default Connection</td>
                            <td><code>{{ $server->allocation->ip }}:{{ $server->allocation->port }}</code></td>
                        </tr>
                        <tr>
                            <td>Connection Alias</td>
                            <td>
                                @if($server->allocation->alias !== $server->allocation->ip)
                                    <code>{{ $server->allocation->alias }}:{{ $server->allocation->port }}</code>
                                @else
                                    <span class="badge bg-secondary-lt">No Alias Assigned</span>
                                @endif
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    <div class="col-lg-4">
        <div class="card">
            <div class="card-body">
                @if($server->isSuspended())
                    <div class="alert alert-warning mb-3">
                        <i class="ti ti-alert-triangle me-2"></i> <strong>Suspended</strong>
                    </div>
                @endif
                @if(!$server->isInstalled())
                    <div class="alert alert-info mb-3">
                        <i class="ti ti-info-circle me-2"></i> <strong>{{ (! $server->isInstalled()) ? 'Installing' : 'Install Failed' }}</strong>
                    </div>
                @endif

                <div class="card mb-3">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div class="me-3">
                                <i class="ti ti-user fs-1 text-muted"></i>
                            </div>
                            <div>
                                <h3 class="mb-0">{{ str_limit($server->user->username, 16) }}</h3>
                                <p class="text-muted mb-0">Server Owner</p>
                            </div>
                        </div>
                    </div>
                    <a href="{{ route('admin.users.view', $server->user->id) }}" class="card-footer d-flex align-items-center text-decoration-none">
                        More info <i class="ti ti-arrow-right ms-auto"></i>
                    </a>
                </div>

                <div class="card mb-3">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div class="me-3">
                                <i class="ti ti-server fs-1 text-muted"></i>
                            </div>
                            <div>
                                <h3 class="mb-0">{{ str_limit($server->node->name, 16) }}</h3>
                                <p class="text-muted mb-0">Server Node</p>
                            </div>
                        </div>
                    </div>
                    <a href="{{ route('admin.nodes.view', $server->node->id) }}" class="card-footer d-flex align-items-center text-decoration-none">
                        More info <i class="ti ti-arrow-right ms-auto"></i>
                    </a>
                </div>

                <form action="{{ route('admin.servers.view.duplicate', $server->id) }}" method="POST">
                    {!! csrf_field() !!}
                    <button type="submit" class="btn btn-secondary w-100">
                        <i class="ti ti-copy me-1"></i> Duplicate Server
                    </button>
                </form>
            </div>
        </div>
    </div>
</div>
@endsection
