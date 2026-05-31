@extends('layouts.admin')

@section('title')
    Nodes &rarr; New
@endsection

@section('content-header')
    <h2 class="page-title">Create Node</h2>
@endsection

@section('admin-content')
<form action="{{ route('admin.nodes.new') }}" method="POST">
    <div class="row">
        <div class="col-lg-6">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Basic Details</h3>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <label for="pName" class="form-label">Name</label>
                        <input type="text" name="name" id="pName" class="form-control" value="{{ old('name') }}" />
                        <small class="form-hint">Character limits: <code>a-zA-Z0-9_.-</code> and <code>[Space]</code> (min 1, max 100 characters).</small>
                    </div>
                    <div class="mb-3">
                        <label for="pDescription" class="form-label">Description</label>
                        <textarea name="description" id="pDescription" rows="4" class="form-control">{{ old('description') }}</textarea>
                    </div>
                    <div class="mb-3">
                        <label for="pLocationId" class="form-label">Location</label>
                        <select name="location_id" id="pLocationId" class="form-select">
                            @foreach($locations as $location)
                                <option value="{{ $location->id }}" {{ $location->id != old('location_id') ?: 'selected' }}>{{ $location->short }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Node Visibility</label>
                        <div>
                            <label class="form-check form-check-inline">
                                <input type="radio" class="form-check-input" id="pPublicTrue" value="1" name="public" checked>
                                <span class="form-check-label">Public</span>
                            </label>
                            <label class="form-check form-check-inline">
                                <input type="radio" class="form-check-input" id="pPublicFalse" value="0" name="public">
                                <span class="form-check-label">Private</span>
                            </label>
                        </div>
                        <small class="form-hint">By setting a node to <code>private</code> you will be denying the ability to auto-deploy to this node.</small>
                    </div>
                    <div class="mb-3">
                        <label for="pFQDN" class="form-label">FQDN</label>
                        <input type="text" name="fqdn" id="pFQDN" class="form-control" value="{{ old('fqdn') }}" />
                        <small class="form-hint">Please enter domain name (e.g <code>node.example.com</code>) to be used for connecting to the daemon. An IP address may be used <em>only</em> if you are not using SSL for this node.</small>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Communicate Over SSL</label>
                        <div>
                            <label class="form-check form-check-inline">
                                <input type="radio" class="form-check-input" id="pSSLTrue" value="https" name="scheme" checked>
                                <span class="form-check-label">Use SSL Connection</span>
                            </label>
                            <label class="form-check form-check-inline">
                                <input type="radio" class="form-check-input" id="pSSLFalse" value="http" name="scheme" @if(request()->isSecure()) disabled @endif>
                                <span class="form-check-label">Use HTTP Connection</span>
                            </label>
                        </div>
                        @if(request()->isSecure())
                            <small class="form-hint text-danger">Your Panel is currently configured to use a secure connection. In order for browsers to connect to your node it <strong>must</strong> use a SSL connection.</small>
                        @else
                            <small class="form-hint">In most cases you should select to use a SSL connection. If using an IP Address or you do not wish to use SSL at all, select a HTTP connection.</small>
                        @endif
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Behind Proxy</label>
                        <div>
                            <label class="form-check form-check-inline">
                                <input type="radio" class="form-check-input" id="pProxyFalse" value="0" name="behind_proxy" checked>
                                <span class="form-check-label">Not Behind Proxy</span>
                            </label>
                            <label class="form-check form-check-inline">
                                <input type="radio" class="form-check-input" id="pProxyTrue" value="1" name="behind_proxy">
                                <span class="form-check-label">Behind Proxy</span>
                            </label>
                        </div>
                        <small class="form-hint">If you are running the daemon behind a proxy such as Cloudflare, select this to have the daemon skip looking for certificates on boot.</small>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-lg-6">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Configuration</h3>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="pDaemonBase" class="form-label">Daemon Server File Directory</label>
                            <input type="text" name="daemonBase" id="pDaemonBase" class="form-control" value="/var/lib/pterodactyl/volumes" />
                            <small class="form-hint">Enter the directory where server files should be stored. <strong>If you use OVH you should check your partition scheme. You may need to use <code>/home/daemon-data</code> to have enough space.</strong></small>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="pMemory" class="form-label">Total Memory</label>
                            <div class="input-group">
                                <input type="text" name="memory" data-multiplicator="true" class="form-control" id="pMemory" value="{{ old('memory') }}" />
                                <span class="input-group-text">MiB</span>
                            </div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="pMemoryOverallocate" class="form-label">Memory Over-Allocation</label>
                            <div class="input-group">
                                <input type="text" name="memory_overallocate" class="form-control" id="pMemoryOverallocate" value="{{ old('memory_overallocate') }}" />
                                <span class="input-group-text">%</span>
                            </div>
                        </div>
                        <div class="col-md-12">
                            <small class="form-hint">Enter the total amount of memory available for new servers. If you would like to allow overallocation of memory enter the percentage that you want to allow. To disable checking for overallocation enter <code>-1</code> into the field. Entering <code>0</code> will prevent creating new servers if it would put the node over the limit.</small>
                        </div>
                    </div>
                    <div class="row mt-3">
                        <div class="col-md-6 mb-3">
                            <label for="pDisk" class="form-label">Total Disk Space</label>
                            <div class="input-group">
                                <input type="text" name="disk" data-multiplicator="true" class="form-control" id="pDisk" value="{{ old('disk') }}" />
                                <span class="input-group-text">MiB</span>
                            </div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="pDiskOverallocate" class="form-label">Disk Over-Allocation</label>
                            <div class="input-group">
                                <input type="text" name="disk_overallocate" class="form-control" id="pDiskOverallocate" value="{{ old('disk_overallocate') }}" />
                                <span class="input-group-text">%</span>
                            </div>
                        </div>
                        <div class="col-md-12">
                            <small class="form-hint">Enter the total amount of disk space available for new servers. If you would like to allow overallocation of disk space enter the percentage that you want to allow. To disable checking for overallocation enter <code>-1</code> into the field. Entering <code>0</code> will prevent creating new servers if it would put the node over the limit.</small>
                        </div>
                    </div>
                    <div class="row mt-3">
                        <div class="col-md-6 mb-3">
                            <label for="pDaemonListen" class="form-label">Daemon Port</label>
                            <input type="text" name="daemonListen" class="form-control" id="pDaemonListen" value="8080" />
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="pDaemonSFTP" class="form-label">Daemon SFTP Port</label>
                            <input type="text" name="daemonSFTP" class="form-control" id="pDaemonSFTP" value="2022" />
                        </div>
                        <div class="col-md-12">
                            <small class="form-hint">The daemon runs its own SFTP management container and does not use the SSHd process on the main physical server. <strong>Do not use the same port that you have assigned for your physical server's SSH process.</strong> If you will be running the daemon behind CloudFlare&reg; you should set the daemon port to <code>8443</code> to allow websocket proxying over SSL.</small>
                        </div>
                    </div>
                </div>
                <div class="card-footer text-end">
                    {!! csrf_field() !!}
                    <button type="submit" class="btn btn-primary">
                        <i class="ti ti-device-floppy me-1"></i> Create Node
                    </button>
                </div>
            </div>
        </div>
    </div>
</form>
@endsection

@section('admin-js')
    <script>
        $('#pLocationId').select2();
    </script>
@endsection
