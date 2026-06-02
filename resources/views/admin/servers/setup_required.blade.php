@extends('layouts.admin')

@section('title')
    Setup Required
@endsection

@section('content-header')
    <h2 class="page-title">Setup Required</h2>
@endsection

@section('admin-content')
<div class="row">
    <div class="col-lg-8">
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Before creating a server</h3>
            </div>
            <div class="card-body">
                <p class="mb-4">You need to configure the following items before you can create a server:</p>

                <div class="mb-4">
                    @if (!$hasLocations)
                        <div class="alert alert-warning d-flex align-items-center" role="alert">
                            <div class="flex-shrink-0">
                                <i class="ti ti-alert-circle" style="font-size: 1.5rem;"></i>
                            </div>
                            <div class="flex-grow-1 ms-3">
                                <strong>No locations configured</strong>
                                <p class="mb-0 text-secondary">Locations organize your nodes by geographic region.</p>
                            </div>
                            <div class="flex-shrink-0">
                                <a href="{{ route('admin.locations.new') }}" class="btn btn-warning btn-sm">Create Location</a>
                            </div>
                        </div>
                    @else
                        <div class="alert alert-success d-flex align-items-center" role="alert">
                            <div class="flex-shrink-0">
                                <i class="ti ti-check" style="font-size: 1.5rem;"></i>
                            </div>
                            <div class="flex-grow-1 ms-3">
                                <strong>Locations configured</strong>
                                <p class="mb-0 text-secondary">You have locations set up.</p>
                            </div>
                        </div>
                    @endif

                    @if (!$hasNodes)
                        <div class="alert alert-warning d-flex align-items-center mt-3" role="alert">
                            <div class="flex-shrink-0">
                                <i class="ti ti-alert-circle" style="font-size: 1.5rem;"></i>
                            </div>
                            <div class="flex-grow-1 ms-3">
                                <strong>No nodes configured</strong>
                                <p class="mb-0 text-secondary">Nodes are the servers that host your instances.</p>
                            </div>
                            <div class="flex-shrink-0">
                                <a href="{{ route('admin.nodes.new') }}" class="btn btn-warning btn-sm">Create Node</a>
                            </div>
                        </div>
                    @else
                        <div class="alert alert-success d-flex align-items-center mt-3" role="alert">
                            <div class="flex-shrink-0">
                                <i class="ti ti-check" style="font-size: 1.5rem;"></i>
                            </div>
                            <div class="flex-grow-1 ms-3">
                                <strong>Nodes configured</strong>
                                <p class="mb-0 text-secondary">You have nodes set up.</p>
                            </div>
                        </div>
                    @endif
                </div>

                @if ($hasLocations && $hasNodes)
                    <div class="alert alert-info d-flex align-items-center" role="alert">
                        <div class="flex-shrink-0">
                            <i class="ti ti-info-circle" style="font-size: 1.5rem;"></i>
                        </div>
                        <div class="flex-grow-1 ms-3">
                            <strong>Ready to create servers</strong>
                            <p class="mb-0 text-secondary">All requirements are met. You can now create your first server.</p>
                        </div>
                        <div class="flex-shrink-0">
                            <a href="{{ route('admin.servers.new') }}" class="btn btn-primary btn-sm">Create Server</a>
                        </div>
                    </div>
                @endif

                <div class="mt-4 p-3 bg-info-lt rounded">
                    <div class="d-flex">
                        <div class="flex-shrink-0">
                            <i class="ti ti-info-circle text-info" style="font-size: 1.25rem;"></i>
                        </div>
                        <div class="flex-grow-1 ms-3">
                            <strong class="text-info">Why is this required?</strong>
                            <p class="mb-0 text-secondary small">Servers need a physical location to operate in, and nodes are the actual servers that will host your game instances. This hierarchy ensures proper resource management and organization.</p>
                        </div>
                    </div>
                </div>

                <div class="mt-3">
                    <a href="{{ route('admin.servers') }}" class="btn btn-secondary">Back to Servers</a>
                </div>
            </div>
        </div>
    </div>

    <div class="col-lg-4">
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Setup Guide</h3>
            </div>
            <div class="card-body">
                <div class="d-flex align-items-center mb-3">
                    <div class="flex-shrink-0">
                        @if($hasLocations)
                            <i class="ti ti-circle-check text-success me-3" style="font-size: 1.25rem;"></i>
                        @else
                            <i class="ti ti-circle text-secondary me-3" style="font-size: 1.25rem;"></i>
                        @endif
                    </div>
                    <div class="flex-grow-1">
                        <strong class="{{ $hasLocations ? 'text-success' : '' }}">Create Location</strong>
                        <p class="mb-0 text-secondary small">Define a geographic location for your nodes.</p>
                    </div>
                </div>

                <div class="d-flex align-items-center mb-3">
                    <div class="flex-shrink-0">
                        @if($hasNodes)
                            <i class="ti ti-circle-check text-success me-3" style="font-size: 1.25rem;"></i>
                        @else
                            <i class="ti ti-circle text-secondary me-3" style="font-size: 1.25rem;"></i>
                        @endif
                    </div>
                    <div class="flex-grow-1">
                        <strong class="{{ $hasNodes ? 'text-success' : '' }}">Create Node</strong>
                        <p class="mb-0 text-secondary small">Add a server node to host your instances.</p>
                    </div>
                </div>

                <div class="d-flex align-items-center">
                    <div class="flex-shrink-0">
                        @if($hasLocations && $hasNodes)
                            <i class="ti ti-circle-check text-success me-3" style="font-size: 1.25rem;"></i>
                        @else
                            <i class="ti ti-circle text-secondary me-3" style="font-size: 1.25rem;"></i>
                        @endif
                    </div>
                    <div class="flex-grow-1">
                        <strong class="{{ $hasLocations && $hasNodes ? 'text-success' : '' }}">Create Server</strong>
                        <p class="mb-0 text-secondary small">Deploy your first game server.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection