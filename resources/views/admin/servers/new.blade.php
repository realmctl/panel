@extends('layouts.admin')

@section('title')
    New Server
@endsection

@section('content-header')
    <h2 class="page-title">Create Server</h2>
@endsection

@section('admin-content')
<form action="{{ route('admin.servers.new') }}" method="POST">
    <div class="row">
        <div class="col-lg-12">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Core Details</h3>
                </div>

                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="pName" class="form-label">Server Name</label>
                                <input type="text" class="form-control" id="pName" name="name" value="{{ old('name') }}" placeholder="Server Name">
                                <span class="form-hint">Character limits: <code>a-z A-Z 0-9 _ - .</code> and <code>[Space]</code>.</span>
                            </div>

                            <div class="mb-3">
                                <label for="pUserId" class="form-label">Server Owner</label>
                                <select id="pUserId" name="owner_id" class="form-control" style="padding-left:0;"></select>
                                <span class="form-hint">Email address of the Server Owner.</span>
                            </div>
                        </div>

                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="pDescription" class="form-label">Server Description</label>
                                <textarea id="pDescription" name="description" rows="3" class="form-control">{{ old('description') }}</textarea>
                                <span class="form-hint">A brief description of this server.</span>
                            </div>

                            <div class="mb-3">
                                <div class="form-check">
                                    <input id="pStartOnCreation" name="start_on_completion" type="checkbox" class="form-check-input" {{ \Pterodactyl\Helpers\Utilities::checked('start_on_completion', 1) }} />
                                    <label for="pStartOnCreation" class="form-check-label fw-bold">Start Server when Installed</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col-lg-12">
            <div class="card">
                <div class="overlay" id="allocationLoader" style="display:none;"><i class="ti ti-refresh"></i></div>
                <div class="card-header">
                    <h3 class="card-title">Allocation Management</h3>
                </div>

                <div class="card-body">
                    <div class="row">
                        <div class="col-lg-4">
                            <div class="mb-3">
                                <label for="pNodeId" class="form-label">Node</label>
                                <select name="node_id" id="pNodeId" class="form-select">
                                    @foreach($locations as $location)
                                        <optgroup label="{{ $location->long }} ({{ $location->short }})">
                                        @foreach($location->nodes as $node)

                                        <option value="{{ $node->id }}"
                                            @if($location->id === old('location_id')) selected @endif
                                        >{{ $node->name }}</option>

                                        @endforeach
                                        </optgroup>
                                    @endforeach
                                </select>
                                <span class="form-hint">The node which this server will be deployed to.</span>
                            </div>
                        </div>

                        <div class="col-lg-4">
                            <div class="mb-3">
                                <label for="pAllocation" class="form-label">Default Allocation</label>
                                <select id="pAllocation" name="allocation_id" class="form-select"></select>
                                <span class="form-hint">The main allocation that will be assigned to this server.</span>
                            </div>
                        </div>

                        <div class="col-lg-4">
                            <div class="mb-3">
                                <label for="pAllocationAdditional" class="form-label">Additional Allocation(s)</label>
                                <select id="pAllocationAdditional" name="allocation_additional[]" class="form-select" multiple></select>
                                <span class="form-hint">Additional allocations to assign to this server on creation.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col-lg-12">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Application Feature Limits</h3>
                </div>

                <div class="card-body">
                    <div class="row">
                        <div class="col-lg-6">
                            <div class="mb-3">
                                <label for="pDatabaseLimit" class="form-label">Database Limit</label>
                                <input type="text" id="pDatabaseLimit" name="database_limit" class="form-control" value="{{ old('database_limit', 0) }}"/>
                                <span class="form-hint">The total number of databases a user is allowed to create for this server.</span>
                            </div>
                        </div>
                        <div class="col-lg-6">
                            <div class="mb-3">
                                <label for="pAllocationLimit" class="form-label">Allocation Limit</label>
                                <input type="text" id="pAllocationLimit" name="allocation_limit" class="form-control" value="{{ old('allocation_limit', 0) }}"/>
                                <span class="form-hint">The total number of allocations a user is allowed to create for this server.</span>
                            </div>
                        </div>
                        <div class="col-lg-6">
                            <div class="mb-3">
                                <label for="pBackupLimit" class="form-label">Backup Limit</label>
                                <input type="text" id="pBackupLimit" name="backup_limit" class="form-control" value="{{ old('backup_limit', 0) }}"/>
                                <span class="form-hint">The total number of backups that can be created for this server.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col-lg-12">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Resource Management</h3>
                </div>

                <div class="card-body">
                    <div class="row">
                        <div class="col-lg-6">
                            <div class="mb-3">
                                <label for="pCPU" class="form-label">CPU Limit</label>
                                <div class="input-group">
                                    <input type="text" id="pCPU" name="cpu" class="form-control" value="{{ old('cpu', 0) }}" />
                                    <span class="input-group-text">%</span>
                                </div>
                                <span class="form-hint">If you do not want to limit CPU usage, set the value to <code>0</code>. To determine a value, take the number of threads and multiply it by 100. For example, on a quad core system without hyperthreading <code>(4 * 100 = 400)</code> there is <code>400%</code> available. To limit a server to using half of a single thread, you would set the value to <code>50</code>. To allow a server to use up to two threads, set the value to <code>200</code>.</span>
                            </div>
                        </div>

                        <div class="col-lg-6">
                            <div class="mb-3">
                                <label for="pThreads" class="form-label">CPU Pinning</label>
                                <input type="text" id="pThreads" name="threads" class="form-control" value="{{ old('threads') }}" />
                                <span class="form-hint"><strong>Advanced:</strong> Enter the specific CPU threads that this process can run on, or leave blank to allow all threads. This can be a single number, or a comma separated list. Example: <code>0</code>, <code>0-1,3</code>, or <code>0,1,3,4</code>.</span>
                            </div>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-lg-6">
                            <div class="mb-3">
                                <label for="pMemory" class="form-label">Memory</label>
                                <div class="input-group">
                                    <input type="text" id="pMemory" name="memory" class="form-control" value="{{ old('memory') }}" />
                                    <span class="input-group-text">MiB</span>
                                </div>
                                <span class="form-hint">The maximum amount of memory allowed for this container. Setting this to <code>0</code> will allow unlimited memory in a container.</span>
                            </div>
                        </div>

                        <div class="col-lg-6">
                            <div class="mb-3">
                                <label for="pSwap" class="form-label">Swap</label>
                                <div class="input-group">
                                    <input type="text" id="pSwap" name="swap" class="form-control" value="{{ old('swap', 0) }}" />
                                    <span class="input-group-text">MiB</span>
                                </div>
                                <span class="form-hint">Setting this to <code>0</code> will disable swap space on this server. Setting to <code>-1</code> will allow unlimited swap.</span>
                            </div>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-lg-6">
                            <div class="mb-3">
                                <label for="pDisk" class="form-label">Disk Space</label>
                                <div class="input-group">
                                    <input type="text" id="pDisk" name="disk" class="form-control" value="{{ old('disk') }}" />
                                    <span class="input-group-text">MiB</span>
                                </div>
                                <span class="form-hint">This server will not be allowed to boot if it is using more than this amount of space. If a server goes over this limit while running it will be safely stopped and locked until enough space is available. Set to <code>0</code> to allow unlimited disk usage.</span>
                            </div>
                        </div>

                        <div class="col-lg-6">
                            <div class="mb-3">
                                <label for="pIO" class="form-label">Block IO Weight</label>
                                <input type="text" id="pIO" name="io" class="form-control" value="{{ old('io', 500) }}" />
                                <span class="form-hint"><strong>Advanced</strong>: The IO performance of this server relative to other <em>running</em> containers on the system. Value should be between <code>10</code> and <code>1000</code>. Please see <a href="https://docs.docker.com/engine/reference/run/#block-io-bandwidth-blkio-constraint" target="_blank">this documentation</a> for more information about it.</span>
                            </div>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-lg-12">
                            <div class="mb-3">
                                <div class="form-check">
                                    <input type="checkbox" id="pOomDisabled" name="oom_disabled" value="0" class="form-check-input" {{ \Pterodactyl\Helpers\Utilities::checked('oom_disabled', 0) }} />
                                    <label for="pOomDisabled" class="form-check-label fw-bold">Enable OOM Killer</label>
                                </div>
                                <span class="form-hint">Terminates the server if it breaches the memory limits. Enabling OOM killer may cause server processes to exit unexpectedly.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col-md-6">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Nest Configuration</h3>
                </div>

                <div class="card-body">
                    <div class="mb-3">
                        <label for="pNestId" class="form-label">Nest</label>
                        <select id="pNestId" name="nest_id" class="form-select">
                            @foreach($nests as $nest)
                                <option value="{{ $nest->id }}"
                                    @if($nest->id === old('nest_id'))
                                        selected="selected"
                                    @endif
                                >{{ $nest->name }}</option>
                            @endforeach
                        </select>
                        <span class="form-hint">Select the Nest that this server will be grouped under.</span>
                    </div>

                    <div class="mb-3">
                        <label for="pEggId" class="form-label">Egg</label>
                        <select id="pEggId" name="egg_id" class="form-select"></select>
                        <span class="form-hint">Select the Egg that will define how this server should operate.</span>
                    </div>

                    <div class="mb-3">
                        <div class="form-check">
                            <input type="checkbox" id="pSkipScripting" name="skip_scripts" value="1" class="form-check-input" {{ \Pterodactyl\Helpers\Utilities::checked('skip_scripts', 0) }} />
                            <label for="pSkipScripting" class="form-check-label fw-bold">Skip Egg Install Script</label>
                        </div>
                        <span class="form-hint">If the selected Egg has an install script attached to it, the script will run during the install. If you would like to skip this step, check this box.</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-md-6">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Docker Configuration</h3>
                </div>

                <div class="card-body">
                    <div class="mb-3">
                        <label for="pDefaultContainer" class="form-label">Docker Image</label>
                        <select id="pDefaultContainer" name="image" class="form-select"></select>
                        <input id="pDefaultContainerCustom" name="custom_image" value="{{ old('custom_image') }}" class="form-control" placeholder="Or enter a custom image..." style="margin-top:1rem"/>
                        <span class="form-hint">This is the default Docker image that will be used to run this server. Select an image from the dropdown above, or enter a custom image in the text field above.</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col-md-12">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Startup Configuration</h3>
                </div>

                <div class="card-body">
                    <div class="mb-3">
                        <label for="pStartup" class="form-label">Startup Command</label>
                        <input type="text" id="pStartup" name="startup" value="{{ old('startup') }}" class="form-control" />
                        <span class="form-hint">The following data substitutes are available for the startup command: <code>@{{SERVER_MEMORY}}</code>, <code>@{{SERVER_IP}}</code>, and <code>@{{SERVER_PORT}}</code>. They will be replaced with the allocated memory, server IP, and server port respectively.</span>
                    </div>
                </div>

                <div class="card-header">
                    <h3 class="card-title">Service Variables</h3>
                </div>

                <div class="card-body">
                    <div class="row" id="appendVariablesTo"></div>
                </div>

                <div class="card-footer">
                    {!! csrf_field() !!}
                    <button type="submit" class="btn btn-primary float-end"><i class="ti ti-device-floppy me-1"></i> Create Server</button>
                </div>
            </div>
        </div>
    </div>
</form>
@endsection

@section('admin-js')
    {!! Theme::js('vendor/lodash/lodash.js') !!}

    <script type="application/javascript">
        // Persist 'Service Variables'
        function serviceVariablesUpdated(eggId, ids) {
            @if (old('egg_id'))
                // Check if the egg id matches.
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
        // END Persist 'Service Variables'
    </script>

    {!! Theme::js('js/admin/new-server.js?v=20220530') !!}

    <script type="application/javascript">
        $(document).ready(function() {
            // Persist 'Server Owner' select2
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
            // END Persist 'Server Owner' select2

            // Persist 'Node' select2
            @if (old('node_id'))
                $('#pNodeId').val('{{ old('node_id') }}').change();

                // Persist 'Default Allocation' select2
                @if (old('allocation_id'))
                    $('#pAllocation').val('{{ old('allocation_id') }}').change();
                @endif
                // END Persist 'Default Allocation' select2

                // Persist 'Additional Allocations' select2
                @if (old('allocation_additional'))
                    const additional_allocations = [];

                    @for ($i = 0; $i < count(old('allocation_additional')); $i++)
                        additional_allocations.push('{{ old('allocation_additional.'.$i)}}');
                    @endfor

                    $('#pAllocationAdditional').val(additional_allocations).change();
                @endif
                // END Persist 'Additional Allocations' select2
            @endif
            // END Persist 'Node' select2

            // Persist 'Nest' select2
            @if (old('nest_id'))
                $('#pNestId').val('{{ old('nest_id') }}').change();

                // Persist 'Egg' select2
                @if (old('egg_id'))
                    $('#pEggId').val('{{ old('egg_id') }}').change();
                @endif
                // END Persist 'Egg' select2
            @endif
            // END Persist 'Nest' select2
        });
    </script>
@endsection
