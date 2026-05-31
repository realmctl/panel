@extends('layouts.admin')
@include('partials/admin.settings.nav', ['activeTab' => 'advanced'])

@section('title')
    Advanced Settings
@endsection

@section('content-header')
    <h2 class="page-title">Advanced Settings</h2>
@endsection

@section('admin-content')
    @yield('settings::nav')
    <form action="" method="POST">
        {{-- Automatic Allocation Creation --}}
        <div class="card mb-3">
            <div class="card-header">
                <h3 class="card-title">Automatic Allocation Creation</h3>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-4 mb-3">
                        <label class="form-label">Status</label>
                        <select class="form-select" name="pterodactyl:client_features:allocations:enabled">
                            <option value="false">Disabled</option>
                            <option value="true" @if(old('pterodactyl:client_features:allocations:enabled', config('pterodactyl.client_features.allocations.enabled'))) selected @endif>Enabled</option>
                        </select>
                        <span class="form-hint">If enabled, users can automatically create new allocations for their server via the frontend.</span>
                    </div>
                    <div class="col-md-4 mb-3">
                        <label class="form-label">Starting Port</label>
                        <input type="number" class="form-control" name="pterodactyl:client_features:allocations:range_start" value="{{ old('pterodactyl:client_features:allocations:range_start', config('pterodactyl.client_features.allocations.range_start')) }}">
                        <span class="form-hint">The starting port in the range that can be automatically allocated.</span>
                    </div>
                    <div class="col-md-4 mb-3">
                        <label class="form-label">Ending Port</label>
                        <input type="number" class="form-control" name="pterodactyl:client_features:allocations:range_end" value="{{ old('pterodactyl:client_features:allocations:range_end', config('pterodactyl.client_features.allocations.range_end')) }}">
                        <span class="form-hint">The ending port in the range that can be automatically allocated.</span>
                    </div>
                </div>
            </div>
            <div class="card-footer text-end">
                {{ csrf_field() }}
                <button type="submit" name="_method" value="PATCH" class="btn btn-primary">
                    <i class="ti ti-device-floppy me-1"></i> Save
                </button>
            </div>
        </div>
    </form>
@endsection
