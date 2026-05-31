@extends('layouts.admin')

@section('title')
    Location &mdash; {{ $location->short }}
@endsection

@section('content-header')
    <h2 class="page-title">{{ $location->short }}</h2>
@endsection

@section('admin-content')
    <div class="row">
        <div class="col-lg-6">
            <div class="card mb-3">
                <div class="card-header">
                    <h3 class="card-title">Location Details</h3>
                </div>
                <form action="{{ route('admin.locations.view', $location->id) }}" method="POST">
                    {!! csrf_field() !!}
                    {!! method_field('PATCH') !!}
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="form-label required">Short Code</label>
                            <input type="text" name="short" class="form-control" value="{{ $location->short }}" required />
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Description</label>
                            <textarea name="long" class="form-control" rows="4">{{ $location->long }}</textarea>
                        </div>
                    </div>
                    <div class="card-footer d-flex">
                        <button name="action" value="delete" class="btn btn-outline-danger">
                            <i class="ti ti-trash me-1"></i> Delete
                        </button>
                        <button name="action" value="edit" class="btn btn-primary ms-auto">
                            <i class="ti ti-device-floppy me-1"></i> Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
        <div class="col-lg-6">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Nodes</h3>
                </div>
                <div class="table-responsive">
                    <table class="table table-vcenter card-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>FQDN</th>
                                <th>Servers</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($location->nodes as $node)
                                <tr>
                                    <td><code>{{ $node->id }}</code></td>
                                    <td><a href="{{ route('admin.nodes.view', $node->id) }}">{{ $node->name }}</a></td>
                                    <td><code>{{ $node->fqdn }}</code></td>
                                    <td>{{ $node->servers->count() }}</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
                @if($location->nodes->isEmpty())
                    <div class="card-body">
                        <div class="empty py-3">
                            <p class="empty-title">No nodes</p>
                            <p class="empty-subtitle text-secondary">No nodes are assigned to this location.</p>
                        </div>
                    </div>
                @endif
            </div>
        </div>
    </div>
@endsection
