@extends('layouts.admin')

@section('title')
    Database Host &mdash; {{ $host->name }}
@endsection

@section('content-header')
    <h2 class="page-title">{{ $host->name }}</h2>
@endsection

@section('admin-content')
    <form action="{{ route('admin.databases.view', $host->id) }}" method="POST">
        {!! csrf_field() !!}
        <div class="row">
            <div class="col-lg-6">
                <div class="card mb-3">
                    <div class="card-header">
                        <h3 class="card-title">Host Details</h3>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="form-label">Name</label>
                            <input type="text" name="name" class="form-control" value="{{ old('name', $host->name) }}" />
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Host</label>
                            <input type="text" name="host" class="form-control" value="{{ old('host', $host->host) }}" />
                            <span class="form-hint">The IP address or FQDN to connect to this MySQL host from the panel.</span>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Port</label>
                            <input type="text" name="port" class="form-control" value="{{ old('port', $host->port) }}" />
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Linked Node</label>
                            <select name="node_id" id="pNodeId" class="form-select">
                                <option value="">None</option>
                                @foreach($locations as $location)
                                    <optgroup label="{{ $location->short }}">
                                        @foreach($location->nodes as $node)
                                            <option value="{{ $node->id }}" {{ $host->node_id !== $node->id ?: 'selected' }}>{{ $node->name }}</option>
                                        @endforeach
                                    </optgroup>
                                @endforeach
                            </select>
                            <span class="form-hint">Defaults to this database host when adding a database to a server on the selected node.</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-lg-6">
                <div class="card mb-3">
                    <div class="card-header">
                        <h3 class="card-title">User Details</h3>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="form-label">Username</label>
                            <input type="text" name="username" class="form-control" value="{{ old('username', $host->username) }}" />
                            <span class="form-hint">An account with permissions to create new users and databases.</span>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Password</label>
                            <input type="password" name="password" class="form-control" />
                            <span class="form-hint">Leave blank to keep the current password.</span>
                        </div>
                        <div class="alert alert-warning mb-0">
                            <i class="ti ti-alert-triangle me-2"></i>
                            The account must have the <code>WITH GRANT OPTION</code> permission. Do not use the same MySQL account used by this panel.
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-lg-12">
                <div class="d-flex">
                    <button name="_method" value="DELETE" class="btn btn-outline-danger">
                        <i class="ti ti-trash me-1"></i> Delete
                    </button>
                    <button name="_method" value="PATCH" class="btn btn-primary ms-auto">
                        <i class="ti ti-device-floppy me-1"></i> Save
                    </button>
                </div>
            </div>
        </div>
    </form>

    {{-- Databases Table --}}
    <div class="card">
        <div class="card-header">
            <h3 class="card-title">Databases</h3>
        </div>
        <div class="table-responsive">
            <table class="table table-vcenter card-table">
                <thead>
                    <tr>
                        <th>Server</th>
                        <th>Database Name</th>
                        <th>Username</th>
                        <th>Connections From</th>
                        <th>Max Connections</th>
                        <th class="w-1"></th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($databases as $database)
                        <tr>
                            <td><a href="{{ route('admin.servers.view', $database->getRelation('server')->id) }}">{{ $database->getRelation('server')->name }}</a></td>
                            <td><code>{{ $database->database }}</code></td>
                            <td><code>{{ $database->username }}</code></td>
                            <td>{{ $database->remote }}</td>
                            <td>{{ $database->max_connections ?? 'Unlimited' }}</td>
                            <td>
                                <a href="{{ route('admin.servers.view.database', $database->getRelation('server')->id) }}" class="btn btn-sm">
                                    Manage
                                </a>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        @if($databases->hasPages())
            <div class="card-footer d-flex align-items-center">
                {!! $databases->render() !!}
            </div>
        @endif
    </div>
@endsection

@section('admin-js')
    <script>
        $('#pNodeId').select2();
    </script>
@endsection
