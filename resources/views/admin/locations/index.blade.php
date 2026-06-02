@extends('layouts.admin')

@section('title')
    Locations
@endsection

@section('content-header')
    <h2 class="page-title">Locations</h2>
@endsection

@section('admin-content')
    <div class="card">
        <div class="card-header">
            <h3 class="card-title">Location List</h3>
            <div class="card-actions">
                <a href="#" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#newLocationModal">
                    <i class="ti ti-plus me-1"></i> Create New
                </a>
            </div>
        </div>
        <div class="table-responsive">
            <table class="table table-vcenter card-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Short Code</th>
                        <th>Description</th>
                        <th class="text-center">Nodes</th>
                        <th class="text-center">Servers</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($locations as $location)
                        <tr>
                            <td><code>{{ $location->id }}</code></td>
                            <td><a href="{{ route('admin.locations.view', $location->id) }}">{{ $location->short }}</a></td>
                            <td class="text-secondary">{{ $location->long }}</td>
                            <td class="text-center">{{ $location->nodes_count }}</td>
                            <td class="text-center">{{ $location->servers_count }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        @if($locations->isEmpty())
            <div class="card-body">
                <div class="empty">
                    <div class="empty-icon"><i class="ti ti-world" style="font-size: 3rem;"></i></div>
                    <p class="empty-title">No locations</p>
                    <p class="empty-subtitle text-secondary">Create a location to organize your nodes.</p>
                </div>
            </div>
        @endif
    </div>

    {{-- Create Modal --}}
    <div class="modal fade" id="newLocationModal" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <form action="{{ route('admin.locations') }}" method="POST">
                    <div class="modal-header">
                        <h5 class="modal-title">Create Location</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label required">Short Code</label>
                            <input type="text" name="short" class="form-control" required />
                            <span class="form-hint">A short identifier (e.g. <code>us.nyc.lvl3</code>). Must be between 1 and 60 characters.</span>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Description</label>
                            <textarea name="long" class="form-control" rows="4"></textarea>
                            <span class="form-hint">A longer description of this location. Must be less than 191 characters.</span>
                        </div>
                    </div>
                    <div class="modal-footer">
                        {!! csrf_field() !!}
                        @if(isset($intended_action) && $intended_action === 'create_server')
                            <input type="hidden" name="intended_action" value="create_server" />
                        @endif
                        <button type="button" class="btn me-auto" data-bs-dismiss="modal">Cancel</button>
                        <button type="submit" class="btn btn-primary">
                            <i class="ti ti-plus me-1"></i> Create
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
@endsection
