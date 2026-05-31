@extends('layouts.admin')

@section('title')
    Create Database Host
@endsection

@section('content-header')
    <h2 class="page-title">Create Database Host</h2>
@endsection

@section('admin-content')
    <form action="{{ route('admin.databases') }}" method="POST">
        {{ csrf_field() }}
        <div class="row">
            <div class="col-lg-8">
                <div class="card mb-3">
                    <div class="card-header">
                        <h3 class="card-title">Connection Details</h3>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="form-label required">Name</label>
                            <input type="text" name="name" class="form-control" value="{{ old('name') }}" required />
                            <span class="form-hint">A short identifier used to distinguish this host from others (e.g. <code>us.nyc.lvl3</code>).</span>
                        </div>
                        <div class="row">
                            <div class="col-md-8 mb-3">
                                <label class="form-label required">Host</label>
                                <input type="text" name="host" class="form-control" value="{{ old('host') }}" required />
                                <span class="form-hint">The IP address or FQDN to connect to this MySQL host from the panel.</span>
                            </div>
                            <div class="col-md-4 mb-3">
                                <label class="form-label required">Port</label>
                                <input type="text" name="port" class="form-control" value="{{ old('port', '3306') }}" required />
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label required">Username</label>
                                <input type="text" name="username" class="form-control" value="{{ old('username') }}" required />
                                <span class="form-hint">An account with permissions to create new users and databases.</span>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label required">Password</label>
                                <input type="password" name="password" class="form-control" required />
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Linked Node</label>
                            <select name="node_id" id="pNodeId" class="form-select">
                                <option value="">None</option>
                                @foreach($locations as $location)
                                    <optgroup label="{{ $location->short }}">
                                        @foreach($location->nodes as $node)
                                            <option value="{{ $node->id }}" {{ old('node_id') == $node->id ? 'selected' : '' }}>{{ $node->name }}</option>
                                        @endforeach
                                    </optgroup>
                                @endforeach
                            </select>
                            <span class="form-hint">Defaults to this database host when adding a database to a server on the selected node.</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-lg-4">
                <div class="card mb-3">
                    <div class="card-header">
                        <h3 class="card-title">Important</h3>
                    </div>
                    <div class="card-body">
                        <div class="alert alert-warning mb-0">
                            <div class="d-flex">
                                <div><i class="ti ti-alert-triangle me-2"></i></div>
                                <div>
                                    The account defined for this database host <strong>must</strong> have the <code>WITH GRANT OPTION</code> permission. If the defined account does not have this permission, requests to create databases <em>will</em> fail.
                                    <br><br>
                                    <strong>Do not use the same account details for MySQL that you have defined for this panel.</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer text-end">
                        <a href="{{ route('admin.databases') }}" class="btn me-2">Cancel</a>
                        <button type="submit" class="btn btn-primary">
                            <i class="ti ti-plus me-1"></i> Create Host
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </form>
@endsection

@section('admin-js')
    <script>
        $('#pNodeId').select2();
    </script>
@endsection
