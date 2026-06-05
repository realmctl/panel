@extends('layouts.admin')

@section('title')
    New Server
@endsection

@section('content-header')
    <h2 class="page-title">Create Server</h2>
    <p class="text-secondary mt-1 mb-0">Deploy a new instance with a guided setup flow.</p>
@endsection

@section('admin-css')
    {!! Theme::css('css/admin-create-server.css?v=20260605e') !!}
@endsection

@section('admin-content')
@php
    $initialStep = 1;
    if ($errors->hasAny(['node_id', 'allocation_id', 'allocation_additional', 'allocation_additional.*'])) {
        $initialStep = 2;
    } elseif ($errors->hasAny(['cpu', 'memory', 'disk', 'swap', 'io', 'threads', 'oom_disabled', 'database_limit', 'allocation_limit', 'backup_limit'])) {
        $initialStep = 3;
    } elseif ($errors->hasAny(['nest_id', 'egg_id', 'image', 'custom_image', 'skip_scripts'])) {
        $initialStep = 4;
    } elseif ($errors->hasAny(['startup', 'environment', 'environment.*'])) {
        $initialStep = 5;
    } elseif ($errors->hasAny(['name', 'owner_id', 'description', 'start_on_completion'])) {
        $initialStep = 1;
    }
@endphp

<div class="create-server" data-initial-step="{{ $initialStep }}">
    <div class="row g-4">
        <div class="col-lg-3">
            <div class="card create-server-nav">
                <div class="card-body">
                    <div class="text-secondary text-uppercase fw-bold mb-2" style="font-size: 0.65rem; letter-spacing: 0.08em;">Setup progress</div>
                    <div class="create-server-step-counter text-secondary mb-3" style="font-size: 0.8rem;">Step {{ $initialStep }} of 5</div>

                    <ul class="create-server-steps" role="tablist">
                        <li>
                            <button type="button" class="create-server-step-btn{{ $initialStep === 1 ? ' is-active' : '' }}{{ $initialStep > 1 ? ' is-complete' : '' }}" data-step="1" @if($initialStep === 1) aria-current="step" @endif>
                                <span class="create-server-step-index">1</span>
                                <span>
                                    <span class="create-server-step-label">General</span>
                                    <span class="create-server-step-desc">Name, owner & description</span>
                                </span>
                            </button>
                        </li>
                        <li>
                            <button type="button" class="create-server-step-btn{{ $initialStep === 2 ? ' is-active' : '' }}{{ $initialStep > 2 ? ' is-complete' : '' }}" data-step="2" @if($initialStep === 2) aria-current="step" @endif>
                                <span class="create-server-step-index">2</span>
                                <span>
                                    <span class="create-server-step-label">Deployment</span>
                                    <span class="create-server-step-desc">Node & allocations</span>
                                </span>
                            </button>
                        </li>
                        <li>
                            <button type="button" class="create-server-step-btn{{ $initialStep === 3 ? ' is-active' : '' }}{{ $initialStep > 3 ? ' is-complete' : '' }}" data-step="3" @if($initialStep === 3) aria-current="step" @endif>
                                <span class="create-server-step-index">3</span>
                                <span>
                                    <span class="create-server-step-label">Resources</span>
                                    <span class="create-server-step-desc">CPU, memory & limits</span>
                                </span>
                            </button>
                        </li>
                        <li>
                            <button type="button" class="create-server-step-btn{{ $initialStep === 4 ? ' is-active' : '' }}{{ $initialStep > 4 ? ' is-complete' : '' }}" data-step="4" @if($initialStep === 4) aria-current="step" @endif>
                                <span class="create-server-step-index">4</span>
                                <span>
                                    <span class="create-server-step-label">Software</span>
                                    <span class="create-server-step-desc">Nest, egg & image</span>
                                </span>
                            </button>
                        </li>
                        <li>
                            <button type="button" class="create-server-step-btn{{ $initialStep === 5 ? ' is-active' : '' }}" data-step="5" @if($initialStep === 5) aria-current="step" @endif>
                                <span class="create-server-step-index">5</span>
                                <span>
                                    <span class="create-server-step-label">Launch</span>
                                    <span class="create-server-step-desc">Startup & variables</span>
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
            <form action="{{ route('admin.servers.new') }}" method="POST" id="createServerForm">
                {{-- Step 1: General --}}
                <div class="create-server-panel{{ $initialStep === 1 ? ' is-active' : '' }}" data-step="1">
                    <div class="card">
                        <div class="card-body">
                            <div class="create-server-step-error alert alert-warning">
                                Fill in the required fields before continuing.
                            </div>

                            <div class="create-server-panel-header">
                                <div class="create-server-panel-icon"><i class="ti ti-server"></i></div>
                                <div>
                                    <h3 class="create-server-panel-title">General information</h3>
                                    <p class="create-server-panel-subtitle">Who owns this server and how should it appear in the panel?</p>
                                </div>
                            </div>

                            <div class="row g-3">
                                <div class="col-12">
                                    <label for="pName" class="form-label">Server name</label>
                                    <input type="text" class="form-control" id="pName" name="name" value="{{ old('name') }}" placeholder="My Minecraft Server" required>
                                    <span class="form-hint">Allowed characters: <code>a-z A-Z 0-9 _ - .</code> and spaces.</span>
                                </div>
                                <div class="col-12">
                                    <label for="pUserId" class="form-label">Server owner</label>
                                    <select id="pUserId" name="owner_id" class="form-select create-server-select" required></select>
                                    <span class="form-hint">Type at least 2 characters to search by email.</span>
                                </div>
                                <div class="col-12">
                                    <label for="pDescription" class="form-label">Description <span class="text-secondary">(optional)</span></label>
                                    <textarea id="pDescription" name="description" rows="2" class="form-control" placeholder="Short note for admins or the owner">{{ old('description') }}</textarea>
                                </div>
                            </div>

                            <label class="create-server-option" for="pStartOnCreation">
                                <input id="pStartOnCreation" name="start_on_completion" type="checkbox" class="create-server-option-input" {{ \Pterodactyl\Helpers\Utilities::checked('start_on_completion', 1) }} />
                                <span class="create-server-option-body">
                                    <span class="create-server-option-title">Start server after installation</span>
                                    <span class="create-server-option-desc">Power on automatically once Wings finishes installing the server.</span>
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

                {{-- Step 2: Deployment --}}
                <div class="create-server-panel{{ $initialStep === 2 ? ' is-active' : '' }}" data-step="2">
                    <div class="card">
                        <div class="overlay" id="allocationLoader" style="display:none;"><i class="ti ti-refresh"></i></div>
                        <div class="card-body">
                            <div class="create-server-step-error alert alert-warning">
                                Select a node and default allocation before continuing.
                            </div>

                            <div class="create-server-panel-header">
                                <div class="create-server-panel-icon"><i class="ti ti-network"></i></div>
                                <div>
                                    <h3 class="create-server-panel-title">Deployment</h3>
                                    <p class="create-server-panel-subtitle">Choose where the server runs and which address players connect to.</p>
                                </div>
                            </div>

                            <div class="row g-3">
                                <div class="col-12">
                                    <label for="pNodeId" class="form-label">Node</label>
                                    <select name="node_id" id="pNodeId" class="form-select create-server-select" required>
                                        @foreach($locations as $location)
                                            <optgroup label="{{ $location->long }} ({{ $location->short }})">
                                            @foreach($location->nodes as $node)
                                                <option value="{{ $node->id }}" @if($location->id === old('location_id')) selected @endif>{{ $node->name }}</option>
                                            @endforeach
                                            </optgroup>
                                        @endforeach
                                    </select>
                                    <span class="form-hint">The physical or virtual machine that will host this server.</span>
                                </div>
                                <div class="col-md-6">
                                    <label for="pAllocation" class="form-label">Primary allocation</label>
                                    <select id="pAllocation" name="allocation_id" class="form-select create-server-select" required></select>
                                    <span class="form-hint">The main IP:port combination for this server.</span>
                                </div>
                                <div class="col-md-6">
                                    <label for="pAllocationAdditional" class="form-label">Additional allocations <span class="text-secondary">(optional)</span></label>
                                    <select id="pAllocationAdditional" name="allocation_additional[]" class="form-select create-server-select" multiple></select>
                                    <span class="form-hint">Extra ports assigned on creation.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {{-- Step 3: Resources --}}
                <div class="create-server-panel{{ $initialStep === 3 ? ' is-active' : '' }}" data-step="3">
                    <div class="card">
                        <div class="card-body">
                            <div class="create-server-step-error alert alert-warning">
                                Memory and disk are required before continuing.
                            </div>

                            <div class="create-server-panel-header">
                                <div class="create-server-panel-icon"><i class="ti ti-cpu"></i></div>
                                <div>
                                    <h3 class="create-server-panel-title">Resources & limits</h3>
                                    <p class="create-server-panel-subtitle">Define how much hardware this server may use and what features the owner can create.</p>
                                </div>
                            </div>

                            <div class="create-server-section-label">Hardware</div>
                            <div class="row g-3">
                                <div class="col-md-4">
                                    <label for="pCPU" class="form-label">CPU limit</label>
                                    <div class="input-group">
                                        <input type="text" id="pCPU" name="cpu" class="form-control" value="{{ old('cpu', 0) }}" />
                                        <span class="input-group-text">%</span>
                                    </div>
                                    <span class="form-hint"><code>0</code> = unlimited. 100% ≈ one thread.</span>
                                </div>
                                <div class="col-md-4">
                                    <label for="pMemory" class="form-label">Memory</label>
                                    <div class="input-group">
                                        <input type="text" id="pMemory" name="memory" class="form-control" value="{{ old('memory') }}" required />
                                        <span class="input-group-text">MiB</span>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <label for="pDisk" class="form-label">Disk space</label>
                                    <div class="input-group">
                                        <input type="text" id="pDisk" name="disk" class="form-control" value="{{ old('disk') }}" required />
                                        <span class="input-group-text">MiB</span>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <label for="pSwap" class="form-label">Swap</label>
                                    <div class="input-group">
                                        <input type="text" id="pSwap" name="swap" class="form-control" value="{{ old('swap', 0) }}" />
                                        <span class="input-group-text">MiB</span>
                                    </div>
                                    <span class="form-hint"><code>0</code> disables swap, <code>-1</code> is unlimited.</span>
                                </div>
                            </div>

                            <div class="create-server-section-label">Feature limits</div>
                            <div class="row g-3">
                                <div class="col-md-4">
                                    <label for="pDatabaseLimit" class="form-label">Databases</label>
                                    <input type="text" id="pDatabaseLimit" name="database_limit" class="form-control" value="{{ old('database_limit', 0) }}"/>
                                </div>
                                <div class="col-md-4">
                                    <label for="pAllocationLimit" class="form-label">Allocations</label>
                                    <input type="text" id="pAllocationLimit" name="allocation_limit" class="form-control" value="{{ old('allocation_limit', 0) }}"/>
                                </div>
                                <div class="col-md-4">
                                    <label for="pBackupLimit" class="form-label">Backups</label>
                                    <input type="text" id="pBackupLimit" name="backup_limit" class="form-control" value="{{ old('backup_limit', 0) }}"/>
                                </div>
                            </div>

                            <details class="create-server-advanced">
                                <summary>Advanced resource options</summary>
                                <div class="create-server-advanced-body">
                                    <div class="row g-3">
                                        <div class="col-md-6">
                                            <label for="pThreads" class="form-label">CPU pinning</label>
                                            <input type="text" id="pThreads" name="threads" class="form-control" value="{{ old('threads') }}" placeholder="e.g. 0,1,3" />
                                            <span class="form-hint">Leave blank to allow all CPU threads.</span>
                                        </div>
                                        <div class="col-md-6">
                                            <label for="pIO" class="form-label">Block IO weight</label>
                                            <input type="text" id="pIO" name="io" class="form-control" value="{{ old('io', 500) }}" />
                                            <span class="form-hint">Value between <code>10</code> and <code>1000</code>.</span>
                                        </div>
                                        <div class="col-12">
                                            <div class="form-check">
                                                <input type="checkbox" id="pOomDisabled" name="oom_disabled" value="0" class="form-check-input" {{ \Pterodactyl\Helpers\Utilities::checked('oom_disabled', 0) }} />
                                                <label for="pOomDisabled" class="form-check-label">Enable OOM killer</label>
                                            </div>
                                            <span class="form-hint">Stops the server if it exceeds the memory limit.</span>
                                        </div>
                                    </div>
                                </div>
                            </details>
                        </div>
                    </div>
                </div>

                {{-- Step 4: Software --}}
                <div class="create-server-panel{{ $initialStep === 4 ? ' is-active' : '' }}" data-step="4">
                    <div class="card">
                        <div class="card-body">
                            <div class="create-server-step-error alert alert-warning">
                                Select a nest and egg before continuing.
                            </div>

                            <div class="create-server-panel-header">
                                <div class="create-server-panel-icon"><i class="ti ti-package"></i></div>
                                <div>
                                    <h3 class="create-server-panel-title">Software</h3>
                                    <p class="create-server-panel-subtitle">Pick the service type and container image for this server.</p>
                                </div>
                            </div>

                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label for="pNestId" class="form-label">Nest</label>
                                    <select id="pNestId" name="nest_id" class="form-select create-server-select" required>
                                        @foreach($nests as $nest)
                                            <option value="{{ $nest->id }}" @if($nest->id === old('nest_id')) selected @endif>{{ $nest->name }}</option>
                                        @endforeach
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label for="pEggId" class="form-label">Egg</label>
                                    <select id="pEggId" name="egg_id" class="form-select create-server-select" required></select>
                                </div>
                                <div class="col-12">
                                    <label for="pDefaultContainer" class="form-label">Docker image</label>
                                    <select id="pDefaultContainer" name="image" class="form-select create-server-select"></select>
                                    <input id="pDefaultContainerCustom" name="custom_image" value="{{ old('custom_image') }}" class="form-control mt-2" placeholder="Or enter a custom image…"/>
                                    <span class="form-hint">Choose a preset image or override with a custom reference.</span>
                                </div>
                                <div class="col-12">
                                    <div class="form-check">
                                        <input type="checkbox" id="pSkipScripting" name="skip_scripts" value="1" class="form-check-input" {{ \Pterodactyl\Helpers\Utilities::checked('skip_scripts', 0) }} />
                                        <label for="pSkipScripting" class="form-check-label">Skip egg install script</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {{-- Step 5: Launch --}}
                <div class="create-server-panel{{ $initialStep === 5 ? ' is-active' : '' }}" data-step="5">
                    <div class="card">
                        <div class="card-body">
                            <div class="create-server-step-error alert alert-warning">
                                A startup command is required.
                            </div>

                            <div class="create-server-panel-header">
                                <div class="create-server-panel-icon"><i class="ti ti-player-play"></i></div>
                                <div>
                                    <h3 class="create-server-panel-title">Launch configuration</h3>
                                    <p class="create-server-panel-subtitle">Set the command Wings uses to start the server and configure egg variables.</p>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label for="pStartup" class="form-label">Startup command</label>
                                <input type="text" id="pStartup" name="startup" value="{{ old('startup') }}" class="form-control font-monospace" required />
                                <span class="form-hint">Available placeholders: <code>@{{SERVER_MEMORY}}</code>, <code>@{{SERVER_IP}}</code>, <code>@{{SERVER_PORT}}</code></span>
                            </div>

                            <div class="create-server-section-label">Service variables</div>
                            <div class="row g-3" id="appendVariablesTo">
                                <div class="col-12 text-secondary" id="appendVariablesEmpty">Select an egg to load its environment variables.</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card create-server-actions">
                    <div class="card-body">
                        <button type="button" class="btn btn-ghost-secondary" id="createServerBack" disabled>
                            <i class="ti ti-arrow-left me-1"></i> Back
                        </button>
                        <div class="ms-auto d-flex gap-2">
                            <button type="button" class="btn btn-primary" id="createServerNext">
                                Continue <i class="ti ti-arrow-right ms-1"></i>
                            </button>
                            <button type="submit" class="btn btn-primary" id="createServerSubmit" style="display:none;">
                                <i class="ti ti-device-floppy me-1"></i> Create server
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
    {!! Theme::js('vendor/lodash/lodash.js') !!}

    <script type="application/javascript">
        function serviceVariablesUpdated(eggId, ids) {
            @if (old('egg_id'))
                if (eggId != '{{ old('egg_id') }}') {
                    return;
                }

                @if (old('environment'))
                    @foreach (old('environment') as $key => $value)
                        $('#' + ids['{{ $key }}']).val('{{ $value }}');
                    @endforeach
                @endif
            @endif
            @if(old('image'))
                $('#pDefaultContainer').val('{{ old('image') }}');
            @endif
        }
    </script>

    {!! Theme::js('js/admin/new-server.js?v=20260605b') !!}
    {!! Theme::js('js/admin/admin-wizard.js?t={cache-version}') !!}
    {!! Theme::js('js/admin/create-server-wizard.js?t={cache-version}') !!}

    <script type="application/javascript">
        $(document).ready(function() {
            if (typeof initCreateServerSelects === 'function') {
                initCreateServerSelects();
            }

            @if (old('owner_id'))
                $.ajax({
                    url: '/admin/users/accounts.json?user_id={{ old('owner_id') }}',
                    dataType: 'json',
                }).then(function (data) {
                    initUserIdSelect([ data ]);
                });
            @else
                initUserIdSelect();
            @endif

            @if (old('node_id'))
                $('#pNodeId').val('{{ old('node_id') }}').trigger('change');

                @if (old('allocation_id'))
                    $('#pAllocation').val('{{ old('allocation_id') }}').trigger('change');
                @endif

                @if (old('allocation_additional'))
                    const additional_allocations = [];
                    @for ($i = 0; $i < count(old('allocation_additional')); $i++)
                        additional_allocations.push('{{ old('allocation_additional.'.$i)}}');
                    @endfor
                    $('#pAllocationAdditional').val(additional_allocations).trigger('change');
                @endif
            @endif

            @if (old('nest_id'))
                $('#pNestId').val('{{ old('nest_id') }}').trigger('change');

                @if (old('egg_id'))
                    $('#pEggId').val('{{ old('egg_id') }}').trigger('change');
                @endif
            @endif

            if (typeof refreshCreateServerSelect2Widths === 'function') {
                refreshCreateServerSelect2Widths();
            }
        });
    </script>
@endsection
