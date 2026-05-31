@extends('layouts.admin')

@section('title')
    Create API Key
@endsection

@section('content-header')
    <h2 class="page-title">Create API Key</h2>
@endsection

@section('admin-content')
    <form method="POST" action="{{ route('admin.api.new') }}">
        {{ csrf_field() }}
        <div class="row">
            <div class="col-lg-8">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Permissions</h3>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-vcenter card-table">
                            <thead>
                                <tr>
                                    <th>Resource</th>
                                    <th class="text-center">Read</th>
                                    <th class="text-center">Read &amp; Write</th>
                                    <th class="text-center">None</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach($resources as $resource)
                                    <tr>
                                        <td class="fw-bold">{{ str_replace('_', ' ', title_case($resource)) }}</td>
                                        <td class="text-center">
                                            <input type="radio" class="form-check-input" id="r_{{ $resource }}" name="r_{{ $resource }}" value="{{ $permissions['r'] }}">
                                        </td>
                                        <td class="text-center">
                                            <input type="radio" class="form-check-input" id="rw_{{ $resource }}" name="r_{{ $resource }}" value="{{ $permissions['rw'] }}">
                                        </td>
                                        <td class="text-center">
                                            <input type="radio" class="form-check-input" id="n_{{ $resource }}" name="r_{{ $resource }}" value="{{ $permissions['n'] }}" checked>
                                        </td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div class="col-lg-4">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Details</h3>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="form-label required">Description</label>
                            <input type="text" name="memo" class="form-control" placeholder="What is this key for?" required>
                        </div>
                        <div class="alert alert-info">
                            <i class="ti ti-info-circle me-2"></i>
                            Once created, you cannot edit permissions. You'll need to create a new key if changes are needed.
                        </div>
                    </div>
                    <div class="card-footer text-end">
                        <a href="{{ route('admin.api.index') }}" class="btn me-2">Cancel</a>
                        <button type="submit" class="btn btn-primary">
                            <i class="ti ti-plus me-1"></i> Create Credentials
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </form>
@endsection
