@extends('layouts.admin')

@section('title')
    Database Hosts
@endsection

@section('content-header')
    <h2 class="page-title">Database Hosts</h2>
@endsection

@section('admin-content')
    <div class="card">
        <div class="card-header">
            <h3 class="card-title">Host List</h3>
            <div class="card-actions">
                <a href="{{ route('admin.databases.new') }}" class="btn btn-primary">
                    <i class="ti ti-plus me-1"></i> Create New
                </a>
            </div>
        </div>
        <div class="table-responsive">
            <table class="table table-vcenter card-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Host</th>
                        <th>Port</th>
                        <th>Username</th>
                        <th class="text-center">Databases</th>
                        <th class="text-center">Node</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($hosts as $host)
                        <tr>
                            <td><code>{{ $host->id }}</code></td>
                            <td><a href="{{ route('admin.databases.view', $host->id) }}">{{ $host->name }}</a></td>
                            <td><code>{{ $host->host }}</code></td>
                            <td><code>{{ $host->port }}</code></td>
                            <td>{{ $host->username }}</td>
                            <td class="text-center">{{ $host->databases_count }}</td>
                            <td class="text-center">
                                @if(! is_null($host->node))
                                    <a href="{{ route('admin.nodes.view', $host->node->id) }}">{{ $host->node->name }}</a>
                                @else
                                    <span class="badge bg-secondary-lt">None</span>
                                @endif
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        @if($hosts->isEmpty())
            <div class="card-body">
                <div class="empty">
                    <div class="empty-icon"><i class="ti ti-database" style="font-size: 3rem;"></i></div>
                    <p class="empty-title">No database hosts</p>
                    <p class="empty-subtitle text-secondary">Add a database host to allow servers to create databases.</p>
                </div>
            </div>
        @endif
    </div>

@endsection

@section('admin-js')
    <script>
        $('#pNodeId').select2();
    </script>
@endsection
