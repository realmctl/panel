@extends('layouts.admin')

@section('title')
    Server — {{ $server->name }}: Build Details
@endsection

@section('content-header')
    <h2 class="page-title">{{ $server->name }}: Build Details</h2>
@endsection

@section('admin-content')
@include('admin.servers.partials.navigation')
<div class="row">
    <form action="{{ route('admin.servers.view.build', $server->id) }}" method="POST">
        <div class="col-lg-5">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Resource Management</h3>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <label for="cpu" class="form-label">CPU Limit</label>
                        <div class="input-group">
                            <input type="text" name="cpu" class="form-control" value="{{ old('cpu', $server->cpu) }}"/>
                            <span class="input-group-text">%</span>
                        </div>
                        <span class="form-hint">Each <em>virtual</em> core (thread) on the system is considered to be <code>100%</code>. Setting this value to <code>0</code> will allow a server to use CPU time without restrictions.</span>
                    </div>
                    <div class="mb-3">
                        <label for="threads" class="form-label">CPU Pinning</label>
                        <div>
                            <input type="text" name="threads" class="form-control" value="{{ old('threads', $server->threads) }}"/>
                        </div>
                        <span class="form-hint"><strong>Advanced:</strong> Enter the specific CPU cores that this process can run on, or leave blank to allow all cores. This can be a single number, or a comma seperated list. Example: <code>0</code>, <code>0-1,3</code>, or <code>0,1,3,4</code>.</span>
                    </div>
                    <div class="mb-3">
                        <label for="memory" class="form-label">Allocated Memory</label>
                        <div class="input-group">
                            <input type="text" name="memory" data-multiplicator="true" class="form-control" value="{{ old('memory', $server->memory) }}"/>
                            <span class="input-group-text">MiB</span>
                        </div>
                        <span class="form-hint">The maximum amount of memory allowed for this container. Setting this to <code>0</code> will allow unlimited memory in a container.</span>
                    </div>
                    <div class="mb-3">
                        <label for="swap" class="form-label">Allocated Swap</label>
                        <div class="input-group">
                            <input type="text" name="swap" data-multiplicator="true" class="form-control" value="{{ old('swap', $server->swap) }}"/>
                            <span class="input-group-text">MiB</span>
                        </div>
                        <span class="form-hint">Setting this to <code>0</code> will disable swap space on this server. Setting to <code>-1</code> will allow unlimited swap.</span>
                    </div>
                    <div class="mb-3">
                        <label for="cpu" class="form-label">Disk Space Limit</label>
                        <div class="input-group">
                            <input type="text" name="disk" class="form-control" value="{{ old('disk', $server->disk) }}"/>
                            <span class="input-group-text">MiB</span>
                        </div>
                        <span class="form-hint">This server will not be allowed to boot if it is using more than this amount of space. If a server goes over this limit while running it will be safely stopped and locked until enough space is available. Set to <code>0</code> to allow unlimited disk usage.</span>
                    </div>
                    <div class="mb-3">
                        <label for="io" class="form-label">Block IO Proportion</label>
                        <div>
                            <input type="text" name="io" class="form-control" value="{{ old('io', $server->io) }}"/>
                        </div>
                        <span class="form-hint"><strong>Advanced</strong>: The IO performance of this server relative to other <em>running</em> containers on the system. Value should be between <code>10</code> and <code>1000</code>.</span>
                    </div>
                    <div class="mb-3">
                        <label for="cpu" class="form-label">OOM Killer</label>
                        <div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" id="pOomKillerEnabled" value="0" name="oom_disabled" @if(!$server->oom_disabled)checked @endif>
                                <label class="form-check-label" for="pOomKillerEnabled">Enabled</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" id="pOomKillerDisabled" value="1" name="oom_disabled" @if($server->oom_disabled)checked @endif>
                                <label class="form-check-label" for="pOomKillerDisabled">Disabled</label>
                            </div>
                            <span class="form-hint">
                                Enabling OOM killer may cause server processes to exit unexpectedly.
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-lg-7">
            <div class="row">
                <div class="col-lg-12">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Application Feature Limits</h3>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="mb-3 col-lg-6">
                                    <label for="database_limit" class="form-label">Database Limit</label>
                                    <div>
                                        <input type="text" name="database_limit" class="form-control" value="{{ old('database_limit', $server->database_limit) }}"/>
                                    </div>
                                    <span class="form-hint">The total number of databases a user is allowed to create for this server.</span>
                                </div>
                                <div class="mb-3 col-lg-6">
                                    <label for="allocation_limit" class="form-label">Allocation Limit</label>
                                    <div>
                                        <input type="text" name="allocation_limit" class="form-control" value="{{ old('allocation_limit', $server->allocation_limit) }}"/>
                                    </div>
                                    <span class="form-hint">The total number of allocations a user is allowed to create for this server.</span>
                                </div>
                                <div class="mb-3 col-lg-6">
                                    <label for="backup_limit" class="form-label">Backup Limit</label>
                                    <div>
                                        <input type="text" name="backup_limit" class="form-control" value="{{ old('backup_limit', $server->backup_limit) }}"/>
                                    </div>
                                    <span class="form-hint">The total number of backups that can be created for this server.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-12">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Allocation Management</h3>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <label for="pAllocation" class="form-label">Game Port</label>
                                <select id="pAllocation" name="allocation_id" class="form-select">
                                    @foreach ($assigned as $assignment)
                                        <option value="{{ $assignment->id }}"
                                            @if($assignment->id === $server->allocation_id)
                                                selected="selected"
                                            @endif
                                        >{{ $assignment->alias }}:{{ $assignment->port }}</option>
                                    @endforeach
                                </select>
                                <span class="form-hint">The default connection address that will be used for this game server.</span>
                            </div>
                            <div class="mb-3">
                                <label for="pAddAllocations" class="form-label">Assign Additional Ports</label>
                                <div>
                                    <select name="add_allocations[]" class="form-select" multiple id="pAddAllocations">
                                        @foreach ($unassigned as $assignment)
                                            <option value="{{ $assignment->id }}">{{ $assignment->alias }}:{{ $assignment->port }}</option>
                                        @endforeach
                                    </select>
                                </div>
                                <span class="form-hint">Please note that due to software limitations you cannot assign identical ports on different IPs to the same server.</span>
                            </div>
                            <div class="mb-3">
                                <label for="pRemoveAllocations" class="form-label">Remove Additional Ports</label>
                                <div>
                                    <select name="remove_allocations[]" class="form-select" multiple id="pRemoveAllocations">
                                        @foreach ($assigned as $assignment)
                                            <option value="{{ $assignment->id }}">{{ $assignment->alias }}:{{ $assignment->port }}</option>
                                        @endforeach
                                    </select>
                                </div>
                                <span class="form-hint">Simply select which ports you would like to remove from the list above. If you want to assign a port on a different IP that is already in use you can select it from the left and delete it here.</span>
                            </div>
                        </div>
                        <div class="card-footer">
                            {!! csrf_field() !!}
                            <button type="submit" class="btn btn-primary float-end"><i class="ti ti-device-floppy me-1"></i> Save</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </form>
</div>
@endsection

@section('admin-js')
    <script>
    $('#pAddAllocations').select2();
    $('#pRemoveAllocations').select2();
    $('#pAllocation').select2();
    </script>
@endsection
