@extends('layouts.admin')

@section('title')
    {{ $node->name }}
@endsection

@section('content-header')
    <h2 class="page-title">{{ $node->name }}</h2>
@endsection

@section('admin-content')
<div class="row mb-3">
    <div class="col-lg-12">
        <ul class="nav nav-tabs">
            <li class="nav-item">
                <a class="nav-link active" href="{{ route('admin.nodes.view', $node->id) }}">About</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="{{ route('admin.nodes.view.settings', $node->id) }}">Settings</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="{{ route('admin.nodes.view.configuration', $node->id) }}">Configuration</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="{{ route('admin.nodes.view.allocation', $node->id) }}">Allocation</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="{{ route('admin.nodes.view.servers', $node->id) }}">Servers</a>
            </li>
        </ul>
    </div>
</div>
<div class="row">
    <div class="col-lg-8">
        <div class="row">
            <div class="col-lg-12">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Information</h3>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-vcenter card-table">
                            <tbody>
                                <tr>
                                    <td>Daemon Version</td>
                                    <td><code data-attr="info-version"><i class="ti ti-loader-2 ti-spin"></i></code> (Latest: <code>{{ $version->getDaemon() }}</code>)</td>
                                </tr>
                                <tr>
                                    <td>System Information</td>
                                    <td data-attr="info-system"><i class="ti ti-loader-2 ti-spin"></i></td>
                                </tr>
                                <tr>
                                    <td>Total CPU Threads</td>
                                    <td data-attr="info-cpus"><i class="ti ti-loader-2 ti-spin"></i></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            @if ($node->description)
                <div class="col-lg-12">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Description</h3>
                        </div>
                        <div class="card-body">
                            <pre class="mb-0">{{ $node->description }}</pre>
                        </div>
                    </div>
                </div>
            @endif
            <div class="col-lg-12 mt-3">
                <div class="card border-danger">
                    <div class="card-header">
                        <h3 class="card-title text-danger">Delete Node</h3>
                    </div>
                    <div class="card-body">
                        <p class="mb-0">Deleting a node is a irreversible action and will immediately remove this node from the panel. There must be no servers associated with this node in order to continue.</p>
                    </div>
                    <div class="card-footer">
                        <form action="{{ route('admin.nodes.view.delete', $node->id) }}" method="POST">
                            {!! csrf_field() !!}
                            {!! method_field('DELETE') !!}
                            <button type="submit" class="btn btn-outline-danger float-end" {{ ($node->servers_count < 1) ?: 'disabled' }}>
                                <i class="ti ti-trash me-1"></i> Delete Node
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="col-lg-4">
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">At-a-Glance</h3>
            </div>
            <div class="card-body">
                @if($node->maintenance_mode)
                <div class="mb-3">
                    <div class="alert alert-warning mb-0">
                        <div class="d-flex align-items-center">
                            <i class="ti ti-alert-triangle me-2"></i>
                            <div>
                                <div>This node is under</div>
                                <strong>Maintenance</strong>
                            </div>
                        </div>
                    </div>
                </div>
                @endif
                <div class="mb-3">
                    <div class="d-flex align-items-center mb-1">
                        <i class="ti ti-folder me-2"></i>
                        <span>Disk Space Allocated</span>
                    </div>
                    <div class="d-flex align-items-center">
                        <div class="flex-fill">
                            <div class="progress mb-1" style="height: 6px;">
                                <div class="progress-bar bg-{{ $stats['disk']['css'] }}" style="width: {{ $stats['disk']['percent'] }}%"></div>
                            </div>
                            <small class="text-muted">{{ $stats['disk']['value'] }} / {{ $stats['disk']['max'] }} MiB</small>
                        </div>
                    </div>
                </div>
                <div class="mb-3">
                    <div class="d-flex align-items-center mb-1">
                        <i class="ti ti-cpu me-2"></i>
                        <span>Memory Allocated</span>
                    </div>
                    <div class="d-flex align-items-center">
                        <div class="flex-fill">
                            <div class="progress mb-1" style="height: 6px;">
                                <div class="progress-bar bg-{{ $stats['memory']['css'] }}" style="width: {{ $stats['memory']['percent'] }}%"></div>
                            </div>
                            <small class="text-muted">{{ $stats['memory']['value'] }} / {{ $stats['memory']['max'] }} MiB</small>
                        </div>
                    </div>
                </div>
                <div class="mb-3">
                    <div class="d-flex align-items-center">
                        <i class="ti ti-server me-2"></i>
                        <span>Total Servers</span>
                        <span class="ms-auto badge bg-blue">{{ $node->servers_count }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

@section('admin-js')
    <script>
    function escapeHtml(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    (function getInformation() {
        $.ajax({
            method: 'GET',
            url: '/admin/nodes/view/{{ $node->id }}/system-information',
            timeout: 5000,
        }).done(function (data) {
            $('[data-attr="info-version"]').html(escapeHtml(data.version));
            $('[data-attr="info-system"]').html(escapeHtml(data.system.type) + ' (' + escapeHtml(data.system.arch) + ') <code>' + escapeHtml(data.system.release) + '</code>');
            $('[data-attr="info-cpus"]').html(data.system.cpus);
        }).fail(function (jqXHR) {

        }).always(function() {
            setTimeout(getInformation, 10000);
        });
    })();
    </script>
@endsection
