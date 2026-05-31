@extends('layouts.admin')
@include('partials/admin.settings.nav', ['activeTab' => 'security'])

@section('title')
    Security Settings
@endsection

@section('content-header')
    <h2 class="page-title">Security Settings</h2>
@endsection

@section('admin-content')
    @yield('settings::nav')
    <form action="{{ route('admin.settings.security') }}" method="POST">
        {{-- CAPTCHA --}}
        <div class="card mb-3">
            <div class="card-header">
                <h3 class="card-title">CAPTCHA</h3>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-4 mb-3">
                        <label class="form-label">Provider</label>
                        <select class="form-select" name="captcha:provider" id="captchaProvider">
                            <option value="recaptcha" @if(old('captcha:provider', config('captcha.provider')) === 'recaptcha') selected @endif>Google reCAPTCHA</option>
                            <option value="turnstile" @if(old('captcha:provider', config('captcha.provider')) === 'turnstile') selected @endif>Cloudflare Turnstile</option>
                            <option value="none" @if(old('captcha:provider', config('captcha.provider')) === 'none') selected @endif>Disabled</option>
                        </select>
                        <span class="form-hint">Select which CAPTCHA provider to use on login and password reset forms.</span>
                    </div>
                </div>
                {{-- Google reCAPTCHA --}}
                <div class="row" id="recaptchaSettings">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">reCAPTCHA Site Key</label>
                        <input type="text" class="form-control" name="captcha:recaptcha:website_key" value="{{ old('captcha:recaptcha:website_key', config('captcha.recaptcha.website_key')) }}">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">reCAPTCHA Secret Key</label>
                        <input type="text" class="form-control" name="captcha:recaptcha:secret_key" value="{{ old('captcha:recaptcha:secret_key', config('captcha.recaptcha.secret_key')) }}">
                        <span class="form-hint">Used for communication between your site and Google. Keep it secret.</span>
                    </div>
                </div>
                {{-- Cloudflare Turnstile --}}
                <div class="row" id="turnstileSettings" style="display: none;">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Turnstile Site Key</label>
                        <input type="text" class="form-control" name="captcha:turnstile:website_key" value="{{ old('captcha:turnstile:website_key', config('captcha.turnstile.website_key')) }}">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Turnstile Secret Key</label>
                        <input type="text" class="form-control" name="captcha:turnstile:secret_key" value="{{ old('captcha:turnstile:secret_key', config('captcha.turnstile.secret_key')) }}">
                        <span class="form-hint">Used for communication between your site and Cloudflare. Keep it secret.</span>
                    </div>
                </div>
                @if($showRecaptchaWarning)
                    <div class="row" id="recaptchaWarning">
                        <div class="col-12">
                            <div class="alert alert-warning">
                                <i class="ti ti-alert-triangle me-2"></i>
                                You are currently using reCAPTCHA keys that were shipped with this Panel. For improved security it is recommended to <a href="https://www.google.com/recaptcha/admin" target="_blank">generate new invisible reCAPTCHA keys</a> tied to your website.
                            </div>
                        </div>
                    </div>
                @endif
            </div>
        </div>

        {{-- HTTP Connections --}}
        <div class="card mb-3">
            <div class="card-header">
                <h3 class="card-title">HTTP Connections</h3>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Connection Timeout</label>
                        <div class="input-group">
                            <input type="number" required class="form-control" name="pterodactyl:guzzle:connect_timeout" value="{{ old('pterodactyl:guzzle:connect_timeout', config('pterodactyl.guzzle.connect_timeout')) }}">
                            <span class="input-group-text">seconds</span>
                        </div>
                        <span class="form-hint">Time to wait for a connection to be opened before throwing an error.</span>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Request Timeout</label>
                        <div class="input-group">
                            <input type="number" required class="form-control" name="pterodactyl:guzzle:timeout" value="{{ old('pterodactyl:guzzle:timeout', config('pterodactyl.guzzle.timeout')) }}">
                            <span class="input-group-text">seconds</span>
                        </div>
                        <span class="form-hint">Time to wait for a request to complete before throwing an error.</span>
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

@section('admin-js')
    <script>
        (function () {
            var providerSelect = document.getElementById('captchaProvider');
            var recaptchaSettings = document.getElementById('recaptchaSettings');
            var turnstileSettings = document.getElementById('turnstileSettings');
            var recaptchaWarning = document.getElementById('recaptchaWarning');

            function toggleSettings() {
                var provider = providerSelect.value;
                recaptchaSettings.style.display = provider === 'recaptcha' ? '' : 'none';
                turnstileSettings.style.display = provider === 'turnstile' ? '' : 'none';
                if (recaptchaWarning) {
                    recaptchaWarning.style.display = provider === 'recaptcha' ? '' : 'none';
                }
            }

            providerSelect.addEventListener('change', toggleSettings);
            toggleSettings();
        })();
    </script>
@endsection
