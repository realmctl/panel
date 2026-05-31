@extends('layouts.admin')

@section('title')
    Nests &rarr; {{ $nest->name }}
@endsection

@section('content-header')
    <h2 class="page-title">{{ $nest->name }}</h2>
@endsection

@section('admin-content')
<div class="row mb-3">
    <div class="col-lg-6">
        <form action="{{ route('admin.nests.view', $nest->id) }}" method="POST">
            {!! csrf_field() !!}
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Nest Details</h3>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <label class="form-label">Name</label>
                        <input type="text" name="name" class="form-control" value="{{ $nest->name }}" />
                        <span class="form-hint">A descriptive category name that encompasses all eggs within this nest.</span>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Description</label>
                        <textarea name="description" class="form-control" rows="5">{{ $nest->description }}</textarea>
                    </div>
                </div>
                <div class="card-footer d-flex justify-content-between">
                    <button id="deleteButton" type="submit" name="_method" value="DELETE" class="btn btn-outline-danger">
                        <i class="ti ti-trash me-1"></i> Delete
                    </button>
                    <button type="submit" name="_method" value="PATCH" class="btn btn-primary">
                        <i class="ti ti-device-floppy me-1"></i> Save
                    </button>
                </div>
            </div>
        </form>
    </div>
    <div class="col-lg-6">
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Information</h3>
            </div>
            <div class="card-body">
                <div class="mb-3">
                    <label class="form-label">Nest ID</label>
                    <input type="text" readonly class="form-control" value="{{ $nest->id }}" />
                </div>
                <div class="mb-3">
                    <label class="form-label">Author</label>
                    <input type="text" readonly class="form-control" value="{{ $nest->author }}" />
                    <span class="form-hint">The author of this nest. Direct questions and issues to them unless authored by <code>support@realmctl.com</code>.</span>
                </div>
                <div class="mb-3">
                    <label class="form-label">UUID</label>
                    <input type="text" readonly class="form-control" value="{{ $nest->uuid }}" />
                </div>
            </div>
        </div>
    </div>
</div>
<div class="row">
    <div class="col-lg-12">
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Nest Eggs</h3>
                <div class="card-actions">
                    <a href="{{ route('admin.nests.egg.new') }}" class="btn btn-primary">
                        <i class="ti ti-plus me-1"></i> New Egg
                    </a>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-vcenter card-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Description</th>
                            <th class="text-center">Servers</th>
                            <th class="w-1"></th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($nest->eggs as $egg)
                            <tr>
                                <td><code>{{ $egg->id }}</code></td>
                                <td><a href="{{ route('admin.nests.egg.view', $egg->id) }}">{{ $egg->name }}</a></td>
                                <td class="text-secondary">{{ $egg->description }}</td>
                                <td class="text-center">{{ $egg->servers->count() }}</td>
                                <td>
                                    <a href="{{ route('admin.nests.egg.export', ['egg' => $egg->id]) }}" class="btn btn-sm btn-ghost-primary" title="Export">
                                        <i class="ti ti-download"></i>
                                    </a>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
@endsection
