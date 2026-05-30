@extends('layouts.admin')
@include('partials/admin.settings.nav', ['activeTab' => 'advanced'])

@section('title')
    Advanced Settings
@endsection

@section('content-header')
    <h1>Advanced Settings<small>Configure advanced settings for Pterodactyl.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li class="active">Settings</li>
    </ol>
@endsection

@section('content')
    @yield('settings::nav')
    <div class="row">
        <div class="col-xs-12">
            <form action="" method="POST">
                <div class="box">
                    <div class="box-header with-border">
                        <h3 class="box-title">CAPTCHA</h3>
                    </div>
                    <div class="box-body">
                        <div class="row">
                            <div class="form-group col-md-4">
                                <label class="control-label">Provider</label>
                                <div>
                                    <select class="form-control" name="captcha:provider" id="captchaProvider">
                                        <option value="recaptcha" @if(old('captcha:provider', config('captcha.provider')) === 'recaptcha') selected @endif>Google reCAPTCHA</option>
                                        <option value="turnstile" @if(old('captcha:provider', config('captcha.provider')) === 'turnstile') selected @endif>Cloudflare Turnstile</option>
                                        <option value="none" @if(old('captcha:provider', config('captcha.provider')) === 'none') selected @endif>Disabled</option>
                                    </select>
                                    <p class="text-muted small">Select which CAPTCHA provider to use on login and password reset forms. Cloudflare Turnstile does not force mobile QR-code verification.</p>
                                </div>
                            </div>
                        </div>
                        {{-- Google reCAPTCHA keys --}}
                        <div class="row" id="recaptchaSettings">
                            <div class="form-group col-md-6">
                                <label class="control-label">reCAPTCHA Site Key</label>
                                <div>
                                    <input type="text" class="form-control" name="captcha:recaptcha:website_key" value="{{ old('captcha:recaptcha:website_key', config('captcha.recaptcha.website_key')) }}">
                                </div>
                            </div>
                            <div class="form-group col-md-6">
                                <label class="control-label">reCAPTCHA Secret Key</label>
                                <div>
                                    <input type="text" class="form-control" name="captcha:recaptcha:secret_key" value="{{ old('captcha:recaptcha:secret_key', config('captcha.recaptcha.secret_key')) }}">
                                    <p class="text-muted small">Used for communication between your site and Google. Be sure to keep it a secret.</p>
                                </div>
                            </div>
                        </div>
                        {{-- Cloudflare Turnstile keys --}}
                        <div class="row" id="turnstileSettings" style="display: none;">
                            <div class="form-group col-md-6">
                                <label class="control-label">Turnstile Site Key</label>
                                <div>
                                    <input type="text" class="form-control" name="captcha:turnstile:website_key" value="{{ old('captcha:turnstile:website_key', config('captcha.turnstile.website_key')) }}">
                                </div>
                            </div>
                            <div class="form-group col-md-6">
                                <label class="control-label">Turnstile Secret Key</label>
                                <div>
                                    <input type="text" class="form-control" name="captcha:turnstile:secret_key" value="{{ old('captcha:turnstile:secret_key', config('captcha.turnstile.secret_key')) }}">
                                    <p class="text-muted small">Used for communication between your site and Cloudflare. Be sure to keep it a secret.</p>
                                </div>
                            </div>
                        </div>
                        @if($showRecaptchaWarning)
                            <div class="row" id="recaptchaWarning">
                                <div class="col-xs-12">
                                    <div class="alert alert-warning no-margin">
                                        You are currently using reCAPTCHA keys that were shipped with this Panel. For improved security it is recommended to <a href="https://www.google.com/recaptcha/admin">generate new invisible reCAPTCHA keys</a> that are tied specifically to your website.
                                    </div>
                                </div>
                            </div>
                        @endif
                    </div>
                </div>
                <div class="box">
                    <div class="box-header with-border">
                        <h3 class="box-title">HTTP Connections</h3>
                    </div>
                    <div class="box-body">
                        <div class="row">
                            <div class="form-group col-md-6">
                                <label class="control-label">Connection Timeout</label>
                                <div>
                                    <input type="number" required class="form-control" name="pterodactyl:guzzle:connect_timeout" value="{{ old('pterodactyl:guzzle:connect_timeout', config('pterodactyl.guzzle.connect_timeout')) }}">
                                    <p class="text-muted small">The amount of time in seconds to wait for a connection to be opened before throwing an error.</p>
                                </div>
                            </div>
                            <div class="form-group col-md-6">
                                <label class="control-label">Request Timeout</label>
                                <div>
                                    <input type="number" required class="form-control" name="pterodactyl:guzzle:timeout" value="{{ old('pterodactyl:guzzle:timeout', config('pterodactyl.guzzle.timeout')) }}">
                                    <p class="text-muted small">The amount of time in seconds to wait for a request to be completed before throwing an error.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="box">
                    <div class="box-header with-border">
                        <h3 class="box-title">Automatic Allocation Creation</h3>
                    </div>
                    <div class="box-body">
                        <div class="row">
                            <div class="form-group col-md-4">
                                <label class="control-label">Status</label>
                                <div>
                                    <select class="form-control" name="pterodactyl:client_features:allocations:enabled">
                                        <option value="false">Disabled</option>
                                        <option value="true" @if(old('pterodactyl:client_features:allocations:enabled', config('pterodactyl.client_features.allocations.enabled'))) selected @endif>Enabled</option>
                                    </select>
                                    <p class="text-muted small">If enabled users will have the option to automatically create new allocations for their server via the frontend.</p>
                                </div>
                            </div>
                            <div class="form-group col-md-4">
                                <label class="control-label">Starting Port</label>
                                <div>
                                    <input type="number" class="form-control" name="pterodactyl:client_features:allocations:range_start" value="{{ old('pterodactyl:client_features:allocations:range_start', config('pterodactyl.client_features.allocations.range_start')) }}">
                                    <p class="text-muted small">The starting port in the range that can be automatically allocated.</p>
                                </div>
                            </div>
                            <div class="form-group col-md-4">
                                <label class="control-label">Ending Port</label>
                                <div>
                                    <input type="number" class="form-control" name="pterodactyl:client_features:allocations:range_end" value="{{ old('pterodactyl:client_features:allocations:range_end', config('pterodactyl.client_features.allocations.range_end')) }}">
                                    <p class="text-muted small">The ending port in the range that can be automatically allocated.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="box box-primary">
                    <div class="box-footer">
                        {{ csrf_field() }}
                        <button type="submit" name="_method" value="PATCH" class="btn btn-sm btn-primary pull-right">Save</button>
                    </div>
                </div>
            </form>
        </div>
    </div>
@endsection

@section('footer-scripts')
    @parent
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
