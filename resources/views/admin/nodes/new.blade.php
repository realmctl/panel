@extends('layouts.admin')

@section('title')
    New Node
@endsection

@section('content-header')
    <h2 class="page-title">Create Node</h2>
    <p class="text-secondary mt-1 mb-0">Add a Wings daemon to your panel with a guided setup flow.</p>
@endsection

@section('admin-css')
    {!! Theme::css('css/admin-create-server.css?v=20260605e') !!}
@endsection

@section('admin-content')
@php
    $initialStep = 1;
    if ($errors->hasAny(['fqdn', 'scheme', 'behind_proxy', 'public'])) {
        $initialStep = 2;
    } elseif ($errors->hasAny(['memory', 'memory_overallocate', 'disk', 'disk_overallocate'])) {
        $initialStep = 3;
    } elseif ($errors->hasAny(['daemonBase', 'daemonListen', 'daemonSFTP'])) {
        $initialStep = 4;
    } elseif ($errors->hasAny(['name', 'description', 'location_id'])) {
        $initialStep = 1;
    }
@endphp

<div class="create-server create-node" data-initial-step="{{ $initialStep }}">
    <div class="row g-4">
        <div class="col-lg-3">
            <div class="card create-server-nav">
                <div class="card-body">
                    <div class="text-secondary text-uppercase fw-bold mb-2" style="font-size: 0.65rem; letter-spacing: 0.08em;">Setup progress</div>
                    <div class="create-server-step-counter text-secondary mb-3" style="font-size: 0.8rem;">Step {{ $initialStep }} of 4</div>

                    <ul class="create-server-steps" role="tablist">
                        <li>
                            <button type="button" class="create-server-step-btn{{ $initialStep === 1 ? ' is-active' : '' }}{{ $initialStep > 1 ? ' is-complete' : '' }}" data-step="1" @if($initialStep === 1) aria-current="step" @endif>
                                <span class="create-server-step-index">1</span>
                                <span>
                                    <span class="create-server-step-label">General</span>
                                    <span class="create-server-step-desc">Name & location</span>
                                </span>
                            </button>
                        </li>
                        <li>
                            <button type="button" class="create-server-step-btn{{ $initialStep === 2 ? ' is-active' : '' }}{{ $initialStep > 2 ? ' is-complete' : '' }}" data-step="2" @if($initialStep === 2) aria-current="step" @endif>
                                <span class="create-server-step-index">2</span>
                                <span>
                                    <span class="create-server-step-label">Connection</span>
                                    <span class="create-server-step-desc">FQDN, SSL & visibility</span>
                                </span>
                            </button>
                        </li>
                        <li>
                            <button type="button" class="create-server-step-btn{{ $initialStep === 3 ? ' is-active' : '' }}{{ $initialStep > 3 ? ' is-complete' : '' }}" data-step="3" @if($initialStep === 3) aria-current="step" @endif>
                                <span class="create-server-step-index">3</span>
                                <span>
                                    <span class="create-server-step-label">Capacity</span>
                                    <span class="create-server-step-desc">Memory & disk limits</span>
                                </span>
                            </button>
                        </li>
                        <li>
                            <button type="button" class="create-server-step-btn{{ $initialStep === 4 ? ' is-active' : '' }}" data-step="4" @if($initialStep === 4) aria-current="step" @endif>
                                <span class="create-server-step-index">4</span>
                                <span>
                                    <span class="create-server-step-label">Daemon</span>
                                    <span class="create-server-step-desc">Paths & ports</span>
                                </span>
                            </button>
                        </li>
                    </ul>

                    <div class="create-server-progress" aria-hidden="true">
                        <div class="create-server-progress-bar"></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-lg-9">
            <form action="{{ route('admin.nodes.new') }}" method="POST" id="createNodeForm">
                {{-- Step 1 --}}
                <div class="create-server-panel{{ $initialStep === 1 ? ' is-active' : '' }}" data-step="1">
                    <div class="card">
                        <div class="card-body">
                            <div class="create-server-step-error alert alert-warning">
                                Fill in the required fields before continuing.
                            </div>

                            <div class="create-server-panel-header">
                                <div class="create-server-panel-icon"><i class="ti ti-server-2"></i></div>
                                <div>
                                    <h3 class="create-server-panel-title">General information</h3>
                                    <p class="create-server-panel-subtitle">Give this node a name and assign it to a location.</p>
                                </div>
                            </div>

                            <div class="row g-3">
                                <div class="col-12">
                                    <label for="pName" class="form-label">Node name</label>
                                    <input type="text" name="name" id="pName" class="form-control" value="{{ old('name') }}" placeholder="eu-west-01" required />
                                    <span class="form-hint">Allowed characters: <code>a-z A-Z 0-9 _ - .</code> and spaces (max 100).</span>
                                </div>
                                <div class="col-12">
                                    <label for="pLocationId" class="form-label">Location</label>
                                    <select name="location_id" id="pLocationId" class="form-select create-server-select" required>
                                        @foreach($locations as $location)
                                            <option value="{{ $location->id }}" @selected(old('location_id', $locations->first()->id ?? null) == $location->id)>
                                                {{ $location->long }} ({{ $location->short }})
                                            </option>
                                        @endforeach
                                    </select>
                                    <span class="form-hint">Groups this node for deployment and display in the panel.</span>
                                </div>
                                <div class="col-12">
                                    <label for="pDescription" class="form-label">Description <span class="text-secondary">(optional)</span></label>
                                    <textarea name="description" id="pDescription" rows="2" class="form-control" placeholder="e.g. Primary EU hosting node">{{ old('description') }}</textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {{-- Step 2 --}}
                <div class="create-server-panel{{ $initialStep === 2 ? ' is-active' : '' }}" data-step="2">
                    <div class="card">
                        <div class="card-body">
                            <div class="create-server-step-error alert alert-warning">
                                Enter a valid FQDN before continuing.
                            </div>

                            <div class="create-server-panel-header">
                                <div class="create-server-panel-icon"><i class="ti ti-network"></i></div>
                                <div>
                                    <h3 class="create-server-panel-title">Connection settings</h3>
                                    <p class="create-server-panel-subtitle">How the panel reaches Wings and whether the node accepts auto-deployments.</p>
                                </div>
                            </div>

                            <div class="row g-3">
                                <div class="col-12">
                                    <label for="pFQDN" class="form-label">FQDN</label>
                                    <input type="text" name="fqdn" id="pFQDN" class="form-control font-monospace" value="{{ old('fqdn') }}" placeholder="node.example.com" required />
                                    <span class="form-hint">Domain Wings listens on. Use an IP only when SSL is disabled.</span>
                                </div>
                            </div>

                            <div class="connection-preview" id="connectionPreview">
                                <div class="connection-preview-icon"><i class="ti ti-plug-connected"></i></div>
                                <div class="connection-preview-body">
                                    <span class="connection-preview-label">Panel connects via</span>
                                    <code class="connection-preview-url" id="connectionPreviewUrl">{{ old('scheme', 'https') }}://{{ old('fqdn') ?: 'node.example.com' }}</code>
                                </div>
                            </div>

                            <div class="connection-settings">
                                <div class="connection-setting">
                                    <div class="connection-setting-header">
                                        <span class="connection-setting-title">Visibility</span>
                                        <span class="connection-setting-hint">Controls auto-deployment to this node</span>
                                    </div>
                                    <div class="connection-segment-track" role="radiogroup" aria-label="Node visibility">
                                        <label class="connection-segment-item" for="pPublicTrue">
                                            <input type="radio" class="connection-segment-input" id="pPublicTrue" value="1" name="public" @checked(old('public', '1') == '1')>
                                            <span class="connection-segment-btn">
                                                <i class="ti ti-world"></i>
                                                <span>Public</span>
                                            </span>
                                        </label>
                                        <label class="connection-segment-item" for="pPublicFalse">
                                            <input type="radio" class="connection-segment-input" id="pPublicFalse" value="0" name="public" @checked(old('public', '1') == '0')>
                                            <span class="connection-segment-btn">
                                                <i class="ti ti-lock"></i>
                                                <span>Private</span>
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                <div class="connection-setting">
                                    <div class="connection-setting-header">
                                        <span class="connection-setting-title">Transport</span>
                                        <span class="connection-setting-hint">How the panel talks to Wings</span>
                                    </div>
                                    <div class="connection-segment-track" role="radiogroup" aria-label="Connection scheme">
                                        <label class="connection-segment-item" for="pSSLTrue">
                                            <input type="radio" class="connection-segment-input" id="pSSLTrue" value="https" name="scheme" @checked(old('scheme', 'https') === 'https')>
                                            <span class="connection-segment-btn">
                                                <i class="ti ti-shield-lock"></i>
                                                <span>HTTPS</span>
                                            </span>
                                        </label>
                                        <label class="connection-segment-item @if(request()->isSecure()) is-disabled @endif" for="pSSLFalse">
                                            <input type="radio" class="connection-segment-input" id="pSSLFalse" value="http" name="scheme" @checked(old('scheme', 'https') === 'http') @disabled(request()->isSecure())>
                                            <span class="connection-segment-btn">
                                                <i class="ti ti-shield-off"></i>
                                                <span>HTTP</span>
                                            </span>
                                        </label>
                                    </div>
                                    @if(request()->isSecure())
                                        <span class="connection-setting-note text-danger">Your panel uses HTTPS — this node must use SSL too.</span>
                                    @endif
                                </div>

                                <div class="connection-setting">
                                    <div class="connection-setting-header">
                                        <span class="connection-setting-title">Network path</span>
                                        <span class="connection-setting-hint">Whether Wings sits behind a reverse proxy</span>
                                    </div>
                                    <div class="connection-segment-track" role="radiogroup" aria-label="Proxy mode">
                                        <label class="connection-segment-item" for="pProxyFalse">
                                            <input type="radio" class="connection-segment-input" id="pProxyFalse" value="0" name="behind_proxy" @checked(old('behind_proxy', '0') == '0')>
                                            <span class="connection-segment-btn">
                                                <i class="ti ti-arrows-left-right"></i>
                                                <span>Direct</span>
                                            </span>
                                        </label>
                                        <label class="connection-segment-item" for="pProxyTrue">
                                            <input type="radio" class="connection-segment-input" id="pProxyTrue" value="1" name="behind_proxy" @checked(old('behind_proxy', '0') == '1')>
                                            <span class="connection-segment-btn">
                                                <i class="ti ti-cloud"></i>
                                                <span>Proxy</span>
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {{-- Step 3 --}}
                <div class="create-server-panel{{ $initialStep === 3 ? ' is-active' : '' }}" data-step="3">
                    <div class="card">
                        <div class="card-body">
                            <div class="create-server-step-error alert alert-warning">
                                Memory and disk values are required before continuing.
                            </div>

                            <div class="create-server-panel-header">
                                <div class="create-server-panel-icon"><i class="ti ti-chart-bar"></i></div>
                                <div>
                                    <h3 class="create-server-panel-title">Capacity</h3>
                                    <p class="create-server-panel-subtitle">Set how much memory and disk can be assigned to servers on this node.</p>
                                </div>
                            </div>

                            <div class="create-server-section-label">Memory</div>
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label for="pMemory" class="form-label">Total memory</label>
                                    <div class="input-group">
                                        <input type="text" name="memory" data-multiplicator="true" class="form-control" id="pMemory" value="{{ old('memory') }}" required />
                                        <span class="input-group-text">MiB</span>
                                    </div>
                                    <span class="form-hint">Supports suffixes like <code>16G</code>.</span>
                                </div>
                                <div class="col-md-6">
                                    <label for="pMemoryOverallocate" class="form-label">Memory over-allocation</label>
                                    <div class="input-group">
                                        <input type="text" name="memory_overallocate" class="form-control" id="pMemoryOverallocate" value="{{ old('memory_overallocate', 0) }}" required />
                                        <span class="input-group-text">%</span>
                                    </div>
                                    <span class="form-hint"><code>-1</code> disables checks, <code>0</code> blocks overcommit.</span>
                                </div>
                            </div>

                            <div class="create-server-section-label">Disk</div>
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label for="pDisk" class="form-label">Total disk space</label>
                                    <div class="input-group">
                                        <input type="text" name="disk" data-multiplicator="true" class="form-control" id="pDisk" value="{{ old('disk') }}" required />
                                        <span class="input-group-text">MiB</span>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <label for="pDiskOverallocate" class="form-label">Disk over-allocation</label>
                                    <div class="input-group">
                                        <input type="text" name="disk_overallocate" class="form-control" id="pDiskOverallocate" value="{{ old('disk_overallocate', 0) }}" required />
                                        <span class="input-group-text">%</span>
                                    </div>
                                    <span class="form-hint"><code>-1</code> disables checks, <code>0</code> blocks overcommit.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {{-- Step 4 --}}
                <div class="create-server-panel{{ $initialStep === 4 ? ' is-active' : '' }}" data-step="4">
                    <div class="card">
                        <div class="card-body">
                            <div class="create-server-step-error alert alert-warning">
                                Complete the daemon configuration before creating the node.
                            </div>

                            <div class="create-server-panel-header">
                                <div class="create-server-panel-icon"><i class="ti ti-settings"></i></div>
                                <div>
                                    <h3 class="create-server-panel-title">Daemon configuration</h3>
                                    <p class="create-server-panel-subtitle">Where Wings stores server data and which ports it listens on.</p>
                                </div>
                            </div>

                            <div class="row g-3">
                                <div class="col-12">
                                    <label for="pDaemonBase" class="form-label">Server files directory</label>
                                    <input type="text" name="daemonBase" id="pDaemonBase" class="form-control font-monospace" value="{{ old('daemonBase', '/var/lib/realm/volumes') }}" required />
                                    <span class="form-hint">Path on the host where server volumes are stored. OVH users may need <code>/home/daemon-data</code>.</span>
                                </div>
                                <div class="col-md-6">
                                    <label for="pDaemonListen" class="form-label">Daemon port</label>
                                    <input type="text" name="daemonListen" class="form-control" id="pDaemonListen" value="{{ old('daemonListen', 8080) }}" required />
                                    <span class="form-hint">Use <code>8443</code> behind Cloudflare for websockets.</span>
                                </div>
                                <div class="col-md-6">
                                    <label for="pDaemonSFTP" class="form-label">SFTP port</label>
                                    <input type="text" name="daemonSFTP" class="form-control" id="pDaemonSFTP" value="{{ old('daemonSFTP', 2022) }}" required />
                                    <span class="form-hint">Must differ from the host's SSH port.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card create-server-actions">
                    <div class="card-body">
                        {!! csrf_field() !!}
                        <button type="button" class="btn btn-ghost-secondary" id="createNodeBack" disabled>
                            <i class="ti ti-arrow-left me-1"></i> Back
                        </button>
                        <div class="ms-auto d-flex gap-2">
                            <button type="button" class="btn btn-primary" id="createNodeNext">
                                Continue <i class="ti ti-arrow-right ms-1"></i>
                            </button>
                            <button type="submit" class="btn btn-primary" id="createNodeSubmit" style="display:none;">
                                <i class="ti ti-device-floppy me-1"></i> Create node
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection

@section('admin-js')
    {!! Theme::js('js/admin/new-node.js?t={cache-version}') !!}
    {!! Theme::js('js/admin/admin-wizard.js?t={cache-version}') !!}
    {!! Theme::js('js/admin/create-node-wizard.js?t={cache-version}') !!}

    <script>
        $(function () {
            if (typeof initCreateNodeSelects === 'function') {
                initCreateNodeSelects();
            }
            if (typeof refreshCreateNodeSelect2Widths === 'function') {
                refreshCreateNodeSelect2Widths();
            }
        });
    </script>
@endsection
