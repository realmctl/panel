@extends('layouts.admin')

@section('title')
    {{ $node->name }}: Settings
@endsection

@section('content-header')
    <h2 class="page-title">{{ $node->name }} — Settings</h2>
@endsection

@section('admin-content')
<div class="row mb-3">
    <div class="col-lg-12">
        <ul class="nav nav-tabs">
            <li class="nav-item">
                <a class="nav-link" href="{{ route('admin.nodes.view', $node->id) }}">About</a>
            </li>
            <li class="nav-item">
                <a class="nav-link active" href="{{ route('admin.nodes.view.settings', $node->id) }}">Settings</a>
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
<form action="{{ route('admin.nodes.view.settings', $node->id) }}" method="POST">
    <div class="row">
        <div class="col-lg-6">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Settings</h3>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <label for="name" class="form-label">Node Name</label>
                        <input type="text" autocomplete="off" name="name" class="form-control" value="{{ old('name', $node->name) }}" />
                        <small class="form-hint">Character limits: <code>a-zA-Z0-9_.-</code> and <code>[Space]</code> (min 1, max 100 characters).</small>
                    </div>
                    <div class="mb-3">
                        <label for="description" class="form-label">Description</label>
                        <textarea name="description" id="description" rows="4" class="form-control">{{ $node->description }}</textarea>
                    </div>
                    <div class="mb-3">
                        <label for="location_id" class="form-label">Location</label>
                        <select name="location_id" class="form-select">
                            @foreach($locations as $location)
                                <option value="{{ $location->id }}" {{ (((int) old('location_id', $node->location_id)) === $location->id) ? 'selected' : '' }}>{{ $location->long }} ({{ $location->short }})</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Allow Automatic Allocation</label>
                        <div>
                            <label class="form-check form-check-inline">
                                <input type="radio" class="form-check-input" name="public" value="1" {{ (old('public', $node->public)) ? 'checked' : '' }} id="public_1">
                                <span class="form-check-label">Yes</span>
                            </label>
                            <label class="form-check form-check-inline">
                                <input type="radio" class="form-check-input" name="public" value="0" {{ (old('public', $node->public)) ? '' : 'checked' }} id="public_0">
                                <span class="form-check-label">No</span>
                            </label>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label for="fqdn" class="form-label">Fully Qualified Domain Name</label>
                        <input type="text" autocomplete="off" name="fqdn" class="form-control" value="{{ old('fqdn', $node->fqdn) }}" />
                        <small class="form-hint">Please enter domain name (e.g <code>node.example.com</code>) to be used for connecting to the daemon. An IP address may only be used if you are not using SSL for this node.</small>
                    </div>
                    <div class="mb-3">
                        <label class="form-label"><span class="badge bg-warning"><i class="ti ti-power"></i></span> Communicate Over SSL</label>
                        <div>
                            <label class="form-check form-check-inline">
                                <input type="radio" class="form-check-input" id="pSSLTrue" value="https" name="scheme" {{ (old('scheme', $node->scheme) === 'https') ? 'checked' : '' }}>
                                <span class="form-check-label">Use SSL Connection</span>
                            </label>
                            <label class="form-check form-check-inline">
                                <input type="radio" class="form-check-input" id="pSSLFalse" value="http" name="scheme" {{ (old('scheme', $node->scheme) !== 'https') ? 'checked' : '' }}>
                                <span class="form-check-label">Use HTTP Connection</span>
                            </label>
                        </div>
                        <small class="form-hint">In most cases you should select to use a SSL connection. If using an IP Address or you do not wish to use SSL at all, select a HTTP connection.</small>
                    </div>
                    <div class="mb-3">
                        <label class="form-label"><span class="badge bg-warning"><i class="ti ti-power"></i></span> Behind Proxy</label>
                        <div>
                            <label class="form-check form-check-inline">
                                <input type="radio" class="form-check-input" id="pProxyFalse" value="0" name="behind_proxy" {{ (old('behind_proxy', $node->behind_proxy) == false) ? 'checked' : '' }}>
                                <span class="form-check-label">Not Behind Proxy</span>
                            </label>
                            <label class="form-check form-check-inline">
                                <input type="radio" class="form-check-input" id="pProxyTrue" value="1" name="behind_proxy" {{ (old('behind_proxy', $node->behind_proxy) == true) ? 'checked' : '' }}>
                                <span class="form-check-label">Behind Proxy</span>
                            </label>
                        </div>
                        <small class="form-hint">If you are running the daemon behind a proxy such as Cloudflare, select this to have the daemon skip looking for certificates on boot.</small>
                    </div>
                    <div class="mb-3">
                        <label class="form-label"><span class="badge bg-warning"><i class="ti ti-tool"></i></span> Maintenance Mode</label>
                        <div>
                            <label class="form-check form-check-inline">
                                <input type="radio" class="form-check-input" id="pMaintenanceFalse" value="0" name="maintenance_mode" {{ (old('maintenance_mode', $node->maintenance_mode) == false) ? 'checked' : '' }}>
                                <span class="form-check-label">Disabled</span>
                            </label>
                            <label class="form-check form-check-inline">
                                <input type="radio" class="form-check-input" id="pMaintenanceTrue" value="1" name="maintenance_mode" {{ (old('maintenance_mode', $node->maintenance_mode) == true) ? 'checked' : '' }}>
                                <span class="form-check-label">Enabled</span>
                            </label>
                        </div>
                        <small class="form-hint">If the node is marked as 'Under Maintenance' users won't be able to access servers that are on this node.</small>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-lg-6">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Allocation Limits</h3>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-lg-6 mb-3">
                            <label for="memory" class="form-label">Total Memory</label>
                            <div class="input-group">
                                <input type="text" name="memory" class="form-control" data-multiplicator="true" value="{{ old('memory', $node->memory) }}" />
                                <span class="input-group-text">MiB</span>
                            </div>
                        </div>
                        <div class="col-lg-6 mb-3">
                            <label for="memory_overallocate" class="form-label">Overallocate</label>
                            <div class="input-group">
                                <input type="text" name="memory_overallocate" class="form-control" value="{{ old('memory_overallocate', $node->memory_overallocate) }}" />
                                <span class="input-group-text">%</span>
                            </div>
                        </div>
                    </div>
                    <small class="form-hint mb-3 d-block">Enter the total amount of memory available on this node for allocation to servers. You may also provide a percentage that can allow allocation of more than the defined memory.</small>
                    <div class="row">
                        <div class="col-lg-6 mb-3">
                            <label for="disk" class="form-label">Disk Space</label>
                            <div class="input-group">
                                <input type="text" name="disk" class="form-control" data-multiplicator="true" value="{{ old('disk', $node->disk) }}" />
                                <span class="input-group-text">MiB</span>
                            </div>
                        </div>
                        <div class="col-lg-6 mb-3">
                            <label for="disk_overallocate" class="form-label">Overallocate</label>
                            <div class="input-group">
                                <input type="text" name="disk_overallocate" class="form-control" value="{{ old('disk_overallocate', $node->disk_overallocate) }}" />
                                <span class="input-group-text">%</span>
                            </div>
                        </div>
                    </div>
                    <small class="form-hint d-block">Enter the total amount of disk space available on this node for server allocation. You may also provide a percentage that will determine the amount of disk space over the set limit to allow.</small>
                </div>
            </div>
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">General Configuration</h3>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <label for="upload_size" class="form-label">Maximum Web Upload Filesize</label>
                        <div class="input-group">
                            <input type="text" name="upload_size" class="form-control" value="{{ old('upload_size', $node->upload_size) }}" />
                            <span class="input-group-text">MiB</span>
                        </div>
                        <small class="form-hint">Enter the maximum size of files that can be uploaded through the web-based file manager.</small>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="daemonListen" class="form-label"><span class="badge bg-warning"><i class="ti ti-power"></i></span> Daemon Port</label>
                            <input type="text" name="daemonListen" class="form-control" value="{{ old('daemonListen', $node->daemonListen) }}" />
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="daemonSFTP" class="form-label"><span class="badge bg-warning"><i class="ti ti-power"></i></span> Daemon SFTP Port</label>
                            <input type="text" name="daemonSFTP" class="form-control" value="{{ old('daemonSFTP', $node->daemonSFTP) }}" />
                        </div>
                    </div>
                    <small class="form-hint">The daemon runs its own SFTP management container and does not use the SSHd process on the main physical server. <strong>Do not use the same port that you have assigned for your physical server's SSH process.</strong></small>
                </div>
            </div>
        </div>
        <div class="col-lg-12 mt-3">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Save Settings</h3>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <label class="form-check">
                            <input type="checkbox" class="form-check-input" name="reset_secret" id="reset_secret" />
                            <span class="form-check-label">Reset Daemon Master Key</span>
                        </label>
                        <small class="form-hint">Resetting the daemon master key will void any request coming from the old key. This key is used for all sensitive operations on the daemon including server creation and deletion. We suggest changing this key regularly for security.</small>
                    </div>
                </div>
                <div class="card-footer text-end">
                    {!! method_field('PATCH') !!}
                    {!! csrf_field() !!}
                    <button type="submit" class="btn btn-primary">
                        <i class="ti ti-device-floppy me-1"></i> Save Changes
                    </button>
                </div>
            </div>
        </div>
    </div>
</form>
@endsection

@section('admin-js')
    <script>
    $('[data-toggle="popover"]').popover({
        placement: 'auto'
    });
    $('select[name="location_id"]').select2();
    </script>
@endsection
