@extends('layouts.admin')
@include('partials/admin.settings.nav', ['activeTab' => 'basic'])

@section('title')
    Settings
@endsection

@section('content-header')
    <h2 class="page-title">Settings</h2>
@endsection

@section('admin-content')
    @yield('settings::nav')
    <form action="{{ route('admin.settings') }}" method="POST">
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Panel Settings</h3>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-4 mb-3">
                        <label class="form-label">Company Name</label>
                        <input type="text" class="form-control" name="app:name" value="{{ old('app:name', config('app.name')) }}" />
                        <span class="form-hint">This is the name used throughout the panel and in emails sent to clients.</span>
                    </div>
                    <div class="col-md-4 mb-3">
                        <label class="form-label">Require 2-Factor Authentication</label>
                        @php
                            $level = old('pterodactyl:auth:2fa_required', config('pterodactyl.auth.2fa_required'));
                        @endphp
                        <select class="form-select" name="pterodactyl:auth:2fa_required">
                            <option value="0" @if($level == 0) selected @endif>Not Required</option>
                            <option value="1" @if($level == 1) selected @endif>Admin Only</option>
                            <option value="2" @if($level == 2) selected @endif>All Users</option>
                        </select>
                        <span class="form-hint">If enabled, accounts in the selected group must have 2FA enabled to use the Panel.</span>
                    </div>
                    <div class="col-md-4 mb-3">
                        <label class="form-label">Default Language</label>
                        <select name="app:locale" class="form-select">
                            @foreach($languages as $key => $value)
                                <option value="{{ $key }}" @if(config('app.locale') === $key) selected @endif>{{ $value }}</option>
                            @endforeach
                        </select>
                        <span class="form-hint">The default language to use when rendering UI components.</span>
                    </div>
                </div>
            </div>
            <div class="card-footer text-end">
                {!! csrf_field() !!}
                <button type="submit" name="_method" value="PATCH" class="btn btn-primary">
                    <i class="ti ti-device-floppy me-1"></i> Save
                </button>
            </div>
        </div>
    </form>
@endsection
