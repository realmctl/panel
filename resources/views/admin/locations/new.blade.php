@extends('layouts.admin')

@section('title')
    Create Location
@endsection

@section('content-header')
    <h2 class="page-title">Create Location</h2>
@endsection

@section('admin-content')
<div class="row">
    <div class="col-lg-6">
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Create Location</h3>
            </div>
            <form action="{{ route('admin.locations') }}" method="POST">
                <div class="card-body">
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
                    @if(session('intended_action') === 'create_server')
                        <input type="hidden" name="intended_action" value="create_server" />
                    @endif
                </div>
                <div class="card-footer">
                    {!! csrf_field() !!}
                    <a href="{{ session('intended_action') === 'create_server' ? route('admin.servers.new') : route('admin.locations') }}" class="btn me-auto">Cancel</a>
                    <button type="submit" class="btn btn-primary">
                        <i class="ti ti-plus me-1"></i> Create
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection