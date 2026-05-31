@extends('layouts.admin')

@section('title')
    Server — {{ $server->name }}: Manage
@endsection

@section('content-header')
    <h2 class="page-title">{{ $server->name }}: Manage</h2>
@endsection

@section('admin-content')
    @include('admin.servers.partials.navigation')
    <div class="row row-cards">
        <div class="col-lg-4">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Reinstall Server</h3>
                </div>
                <div class="card-body">
                    <p>This will reinstall the server with the assigned service scripts. <strong class="text-danger">Danger!</strong> This could overwrite server data.</p>
                </div>
                <div class="card-footer">
                    @if($server->isInstalled())
                        <form action="{{ route('admin.servers.view.manage.reinstall', $server->id) }}" method="POST">
                            {!! csrf_field() !!}
                            <button type="submit" class="btn btn-outline-danger w-100">
                                <i class="ti ti-refresh me-1"></i> Reinstall Server
                            </button>
                        </form>
                    @else
                        <button class="btn btn-outline-danger w-100 disabled">Server Must Install Properly to Reinstall</button>
                    @endif
                </div>
            </div>
        </div>
        <div class="col-lg-4">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Install Status</h3>
                </div>
                <div class="card-body">
                    <p>If you need to change the install status from uninstalled to installed, or vice versa, you may do so with the button below.</p>
                </div>
                <div class="card-footer">
                    <form action="{{ route('admin.servers.view.manage.toggle', $server->id) }}" method="POST">
                        {!! csrf_field() !!}
                        <button type="submit" class="btn btn-primary w-100">
                            <i class="ti ti-toggle-left me-1"></i> Toggle Install Status
                        </button>
                    </form>
                </div>
            </div>
        </div>
        <div class="col-lg-4">
            @if(! $server->isSuspended())
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Suspend Server</h3>
                    </div>
                    <div class="card-body">
                        <p>This will suspend the server, stop any running processes, and immediately block the user from accessing their files or managing the server.</p>
                    </div>
                    <div class="card-footer">
                        <form action="{{ route('admin.servers.view.manage.suspension', $server->id) }}" method="POST">
                            {!! csrf_field() !!}
                            <input type="hidden" name="action" value="suspend" />
                            <button type="submit" class="btn btn-warning w-100 {{ !is_null($server->transfer) ? 'disabled' : '' }}">
                                <i class="ti ti-ban me-1"></i> Suspend Server
                            </button>
                        </form>
                    </div>
                </div>
            @else
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Unsuspend Server</h3>
                    </div>
                    <div class="card-body">
                        <p>This will unsuspend the server and restore normal user access.</p>
                    </div>
                    <div class="card-footer">
                        <form action="{{ route('admin.servers.view.manage.suspension', $server->id) }}" method="POST">
                            {!! csrf_field() !!}
                            <input type="hidden" name="action" value="unsuspend" />
                            <button type="submit" class="btn btn-success w-100">
                                <i class="ti ti-player-play me-1"></i> Unsuspend Server
                            </button>
                        </form>
                    </div>
                </div>
            @endif
        </div>
        <div class="col-lg-4">
            @if(is_null($server->transfer))
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Transfer Server</h3>
                    </div>
                    <div class="card-body">
                        <p>Transfer this server to another node connected to this panel. <strong>Warning!</strong> This feature has not been fully tested.</p>
                    </div>
                    <div class="card-footer">
                        @if($canTransfer)
                            <button class="btn btn-success w-100" data-bs-toggle="modal" data-bs-target="#transferServerModal">
                                <i class="ti ti-transfer me-1"></i> Transfer Server
                            </button>
                        @else
                            <button class="btn btn-success w-100 disabled">Transfer Server</button>
                            <small class="form-hint mt-2">Requires more than one node configured.</small>
                        @endif
                    </div>
                </div>
            @else
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Transfer Server</h3>
                    </div>
                    <div class="card-body">
                        <p>This server is currently being transferred. Transfer initiated at <strong>{{ $server->transfer->created_at }}</strong>.</p>
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-success w-100 disabled">Transfer In Progress</button>
                    </div>
                </div>
            @endif
        </div>
    </div>

    {{-- Transfer Modal --}}
    <div class="modal fade" id="transferServerModal" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <form action="{{ route('admin.servers.view.manage.transfer', $server->id) }}" method="POST">
                    <div class="modal-header">
                        <h5 class="modal-title">Transfer Server</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">Node</label>
                            <select name="node_id" id="pNodeId" class="form-select">
                                @foreach($locations as $location)
                                    <optgroup label="{{ $location->long }} ({{ $location->short }})">
                                        @foreach($location->nodes as $node)
                                            @if($node->id != $server->node_id)
                                                <option value="{{ $node->id }}">{{ $node->name }}</option>
                                            @endif
                                        @endforeach
                                    </optgroup>
                                @endforeach
                            </select>
                            <span class="form-hint">The node which this server will be transferred to.</span>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Default Allocation</label>
                            <select name="allocation_id" id="pAllocation" class="form-select"></select>
                            <span class="form-hint">The main allocation that will be assigned to this server.</span>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Additional Allocation(s)</label>
                            <select name="allocation_additional[]" id="pAllocationAdditional" class="form-select" multiple></select>
                            <span class="form-hint">Additional allocations to assign to this server.</span>
                        </div>
                    </div>
                    <div class="modal-footer">
                        {!! csrf_field() !!}
                        <button type="button" class="btn me-auto" data-bs-dismiss="modal">Cancel</button>
                        <button type="submit" class="btn btn-success">
                            <i class="ti ti-transfer me-1"></i> Confirm Transfer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
@endsection

@section('admin-js')
    {!! Theme::js('vendor/lodash/lodash.js') !!}
    @if($canTransfer)
        {!! Theme::js('js/admin/server/transfer.js') !!}
    @endif
@endsection
