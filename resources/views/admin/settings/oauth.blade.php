@extends('layouts.admin')
@include('partials/admin.settings.nav', ['activeTab' => 'oauth'])

@section('title')
    OAuth Settings
@endsection

@section('content-header')
    <h2 class="page-title">OAuth Settings</h2>
@endsection

@section('admin-content')
    @yield('settings::nav')
    <form action="{{ route('admin.settings.oauth') }}" method="POST">
        {{-- Google --}}
        <div class="card mb-3">
            <div class="card-header">
                <h3 class="card-title"><i class="ti ti-brand-google me-2"></i>Google Sign In</h3>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-4 mb-3">
                        <label class="form-label">Status</label>
                        <select class="form-select" name="oauth:google:enabled">
                            <option value="false" @if(!old('oauth:google:enabled', config('oauth.google.enabled'))) selected @endif>Disabled</option>
                            <option value="true" @if(old('oauth:google:enabled', config('oauth.google.enabled'))) selected @endif>Enabled</option>
                        </select>
                        <span class="form-hint">Allow users to sign in with their Google account.</span>
                    </div>
                    <div class="col-md-4 mb-3">
                        <label class="form-label">Client ID</label>
                        <input type="text" class="form-control" name="oauth:google:client_id" value="{{ old('oauth:google:client_id', config('oauth.google.client_id')) }}" placeholder="your-client-id.apps.googleusercontent.com">
                    </div>
                    <div class="col-md-4 mb-3">
                        <label class="form-label">Client Secret</label>
                        <input type="text" class="form-control" name="oauth:google:client_secret" value="{{ old('oauth:google:client_secret', config('oauth.google.client_secret')) }}">
                        <span class="form-hint">Get credentials from the <a href="https://console.cloud.google.com/apis/credentials" target="_blank">Google Cloud Console</a>.</span>
                    </div>
                </div>
            </div>
        </div>

        {{-- Discord --}}
        <div class="card mb-3">
            <div class="card-header">
                <h3 class="card-title"><i class="ti ti-brand-discord me-2"></i>Discord Sign In</h3>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-4 mb-3">
                        <label class="form-label">Status</label>
                        <select class="form-select" name="oauth:discord:enabled">
                            <option value="false" @if(!old('oauth:discord:enabled', config('oauth.discord.enabled'))) selected @endif>Disabled</option>
                            <option value="true" @if(old('oauth:discord:enabled', config('oauth.discord.enabled'))) selected @endif>Enabled</option>
                        </select>
                        <span class="form-hint">Allow users to sign in with their Discord account.</span>
                    </div>
                    <div class="col-md-4 mb-3">
                        <label class="form-label">Client ID</label>
                        <input type="text" class="form-control" name="oauth:discord:client_id" value="{{ old('oauth:discord:client_id', config('oauth.discord.client_id')) }}">
                    </div>
                    <div class="col-md-4 mb-3">
                        <label class="form-label">Client Secret</label>
                        <input type="text" class="form-control" name="oauth:discord:client_secret" value="{{ old('oauth:discord:client_secret', config('oauth.discord.client_secret')) }}">
                        <span class="form-hint">Get credentials from the <a href="https://discord.com/developers/applications" target="_blank">Discord Developer Portal</a>.</span>
                    </div>
                </div>
            </div>
        </div>

        {{-- GitHub --}}
        <div class="card mb-3">
            <div class="card-header">
                <h3 class="card-title"><i class="ti ti-brand-github me-2"></i>GitHub Sign In</h3>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-4 mb-3">
                        <label class="form-label">Status</label>
                        <select class="form-select" name="oauth:github:enabled">
                            <option value="false" @if(!old('oauth:github:enabled', config('oauth.github.enabled'))) selected @endif>Disabled</option>
                            <option value="true" @if(old('oauth:github:enabled', config('oauth.github.enabled'))) selected @endif>Enabled</option>
                        </select>
                        <span class="form-hint">Allow users to sign in with their GitHub account.</span>
                    </div>
                    <div class="col-md-4 mb-3">
                        <label class="form-label">Client ID</label>
                        <input type="text" class="form-control" name="oauth:github:client_id" value="{{ old('oauth:github:client_id', config('oauth.github.client_id')) }}">
                    </div>
                    <div class="col-md-4 mb-3">
                        <label class="form-label">Client Secret</label>
                        <input type="text" class="form-control" name="oauth:github:client_secret" value="{{ old('oauth:github:client_secret', config('oauth.github.client_secret')) }}">
                        <span class="form-hint">Get credentials from <a href="https://github.com/settings/developers" target="_blank">GitHub Developer Settings</a>.</span>
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

    <div class="card">
        <div class="card-body">
            <h4 class="mb-2">Callback URLs</h4>
            <p class="text-secondary mb-3">Use these URLs when configuring your OAuth applications:</p>
            <div class="mb-2">
                <code>{{ url('/auth/oauth/google/callback') }}</code>
                <span class="text-secondary ms-2">— Google</span>
            </div>
            <div class="mb-2">
                <code>{{ url('/auth/oauth/discord/callback') }}</code>
                <span class="text-secondary ms-2">— Discord</span>
            </div>
            <div>
                <code>{{ url('/auth/oauth/github/callback') }}</code>
                <span class="text-secondary ms-2">— GitHub</span>
            </div>
        </div>
    </div>
@endsection
