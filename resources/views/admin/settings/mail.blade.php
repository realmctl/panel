@extends('layouts.admin')
@include('partials/admin.settings.nav', ['activeTab' => 'mail'])

@section('title')
    Mail Settings
@endsection

@section('content-header')
    <h2 class="page-title">Settings</h2>
    <p class="text-secondary">Configure how the panel should handle sending emails.</p>
@endsection

@section('admin-content')
    @yield('settings::nav')
    <div class="row row-cards">
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Email Settings</h3>
                </div>
                @if($disabled)
                    <div class="card-body">
                        <div class="alert alert-info mb-0">
                            <div class="d-flex">
                                <div><i class="ti ti-info-circle me-2"></i></div>
                                <div>
                                    Your current mail driver (<code>{{ $driver }}</code>) is not configurable through this interface.
                                    Please use <code>php artisan p:environment:mail</code> to update your mail settings, or set
                                    <code>MAIL_MAILER</code> to one of: <code>smtp</code>, <code>mailgun</code>, <code>postmark</code>, or <code>resend</code>.
                                </div>
                            </div>
                        </div>
                    </div>
                @else
                    <form>
                        <div class="card-body">
                            {{-- Provider Selector --}}
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <label class="form-label">Mail Provider</label>
                                    <select name="mail:default" id="mail-driver-select" class="form-select">
                                        <option value="smtp" @if($driver === 'smtp') selected @endif>SMTP</option>
                                        <option value="mailgun" @if($driver === 'mailgun') selected @endif>Mailgun</option>
                                        <option value="postmark" @if($driver === 'postmark') selected @endif>Postmark</option>
                                        <option value="resend" @if($driver === 'resend') selected @endif>Resend</option>
                                    </select>
                                    <span class="form-hint">Select the mail provider you want to use for sending emails.</span>
                                </div>
                            </div>

                            {{-- SMTP Fields --}}
                            <div id="driver-smtp" class="driver-fields" style="display: none;">
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label class="form-label">SMTP Host</label>
                                        <input type="text" class="form-control" name="mail:mailers:smtp:host" value="{{ old('mail:mailers:smtp:host', config('mail.mailers.smtp.host')) }}" />
                                        <span class="form-hint">Enter the SMTP server address that mail should be sent through.</span>
                                    </div>
                                    <div class="col-md-2">
                                        <label class="form-label">SMTP Port</label>
                                        <input type="number" class="form-control" name="mail:mailers:smtp:port" value="{{ old('mail:mailers:smtp:port', config('mail.mailers.smtp.port')) }}" />
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Encryption</label>
                                        @php
                                            $encryption = old('mail:mailers:smtp:encryption', config('mail.mailers.smtp.encryption'));
                                        @endphp
                                        <select name="mail:mailers:smtp:encryption" class="form-select">
                                            <option value="" @if($encryption === '' || $encryption === null) selected @endif>None</option>
                                            <option value="tls" @if($encryption === 'tls') selected @endif>TLS</option>
                                            <option value="ssl" @if($encryption === 'ssl') selected @endif>SSL</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label class="form-label">Username</label>
                                        <input type="text" class="form-control" name="mail:mailers:smtp:username" value="{{ old('mail:mailers:smtp:username', config('mail.mailers.smtp.username')) }}" />
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Password</label>
                                        <input type="password" class="form-control" name="mail:mailers:smtp:password" />
                                        <span class="form-hint">Leave blank to keep the existing password. Enter <code>!e</code> to clear it.</span>
                                    </div>
                                </div>
                            </div>

                            {{-- Mailgun Fields --}}
                            <div id="driver-mailgun" class="driver-fields" style="display: none;">
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label class="form-label">Mailgun Domain</label>
                                        <input type="text" class="form-control" name="services:mailgun:domain" value="{{ old('services:mailgun:domain', config('services.mailgun.domain')) }}" />
                                        <span class="form-hint">Your Mailgun sending domain (e.g. <code>mg.example.com</code>).</span>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Mailgun API Key</label>
                                        <input type="password" class="form-control" name="services:mailgun:secret" />
                                        <span class="form-hint">Leave blank to keep the existing key.</span>
                                    </div>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label class="form-label">Mailgun Endpoint</label>
                                        <input type="text" class="form-control" name="services:mailgun:endpoint" value="{{ old('services:mailgun:endpoint', config('services.mailgun.endpoint', 'api.mailgun.net')) }}" />
                                        <span class="form-hint">Use <code>api.eu.mailgun.net</code> for EU region.</span>
                                    </div>
                                </div>
                            </div>

                            {{-- Postmark Fields --}}
                            <div id="driver-postmark" class="driver-fields" style="display: none;">
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label class="form-label">Postmark Server Token</label>
                                        <input type="password" class="form-control" name="services:postmark:token" />
                                        <span class="form-hint">Leave blank to keep the existing token.</span>
                                    </div>
                                </div>
                            </div>

                            {{-- Resend Fields --}}
                            <div id="driver-resend" class="driver-fields" style="display: none;">
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label class="form-label">Resend API Key</label>
                                        <input type="password" class="form-control" name="services:resend:key" />
                                        <span class="form-hint">Leave blank to keep the existing key. Get one at <a href="https://resend.com/api-keys" target="_blank">resend.com/api-keys</a>.</span>
                                    </div>
                                </div>
                            </div>

                            {{-- From Address (shared by all providers) --}}
                            <div class="row mt-3">
                                <div class="col-md-6">
                                    <label class="form-label required">Mail From Address</label>
                                    <input required type="email" class="form-control" name="mail:from:address" value="{{ old('mail:from:address', config('mail.from.address')) }}" />
                                    <span class="form-hint">Enter an email address that all outgoing emails will originate from.</span>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Mail From Name</label>
                                    <input type="text" class="form-control" name="mail:from:name" value="{{ old('mail:from:name', config('mail.from.name')) }}" />
                                    <span class="form-hint">The name that emails should appear to come from.</span>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer text-end">
                            {{ csrf_field() }}
                            <button type="button" id="testButton" class="btn btn-success me-2">
                                <i class="ti ti-send me-1"></i> Test
                            </button>
                            <button type="button" id="saveButton" class="btn btn-primary">
                                <i class="ti ti-device-floppy me-1"></i> Save
                            </button>
                        </div>
                    </form>
                @endif
            </div>
        </div>
    </div>
@endsection

@section('admin-js')

    <script>
        function showDriverFields(driver) {
            $('.driver-fields').hide();
            $('#driver-' + driver).show();
        }

        function getFormData() {
            var driver = $('#mail-driver-select').val();
            var data = {
                'mail:default': driver,
                'mail:from:address': $('input[name="mail:from:address"]').val(),
                'mail:from:name': $('input[name="mail:from:name"]').val()
            };

            switch (driver) {
                case 'smtp':
                    data['mail:mailers:smtp:host'] = $('input[name="mail:mailers:smtp:host"]').val();
                    data['mail:mailers:smtp:port'] = $('input[name="mail:mailers:smtp:port"]').val();
                    data['mail:mailers:smtp:encryption'] = $('select[name="mail:mailers:smtp:encryption"]').val();
                    data['mail:mailers:smtp:username'] = $('input[name="mail:mailers:smtp:username"]').val();
                    data['mail:mailers:smtp:password'] = $('input[name="mail:mailers:smtp:password"]').val();
                    break;
                case 'mailgun':
                    data['services:mailgun:domain'] = $('input[name="services:mailgun:domain"]').val();
                    data['services:mailgun:secret'] = $('input[name="services:mailgun:secret"]').val();
                    data['services:mailgun:endpoint'] = $('input[name="services:mailgun:endpoint"]').val();
                    break;
                case 'postmark':
                    data['services:postmark:token'] = $('input[name="services:postmark:token"]').val();
                    break;
                case 'resend':
                    data['services:resend:key'] = $('input[name="services:resend:key"]').val();
                    break;
            }

            return data;
        }

        function saveSettings() {
            return $.ajax({
                method: 'PATCH',
                url: '/admin/settings/mail',
                contentType: 'application/json',
                data: JSON.stringify(getFormData()),
                headers: { 'X-CSRF-Token': $('input[name="_token"]').val() }
            }).fail(function (jqXHR) {
                showErrorDialog(jqXHR, 'save');
            });
        }

        function testSettings() {
            swal({
                type: 'info',
                title: 'Test Mail Settings',
                text: 'Click "Test" to send a test email to your account address.',
                showCancelButton: true,
                confirmButtonText: 'Test',
                closeOnConfirm: false,
                showLoaderOnConfirm: true
            }, function () {
                $.ajax({
                    method: 'POST',
                    url: '/admin/settings/mail/test',
                    headers: { 'X-CSRF-TOKEN': $('input[name="_token"]').val() }
                }).fail(function (jqXHR) {
                    showErrorDialog(jqXHR, 'test');
                }).done(function () {
                    swal({
                        title: 'Success',
                        text: 'The test message was sent successfully.',
                        type: 'success'
                    });
                });
            });
        }

        function saveAndTestSettings() {
            saveSettings().done(testSettings);
        }

        function showErrorDialog(jqXHR, verb) {
            console.error(jqXHR);
            var errorText = '';
            if (!jqXHR.responseJSON) {
                errorText = jqXHR.responseText;
            } else if (jqXHR.responseJSON.error) {
                errorText = jqXHR.responseJSON.error;
            } else if (jqXHR.responseJSON.errors) {
                $.each(jqXHR.responseJSON.errors, function (i, v) {
                    if (v.detail) {
                        errorText += v.detail + ' ';
                    }
                });
            }

            swal({
                title: 'Whoops!',
                text: 'An error occurred while attempting to ' + verb + ' mail settings: ' + errorText,
                type: 'error'
            });
        }

        $(document).ready(function () {
            showDriverFields($('#mail-driver-select').val());

            $('#mail-driver-select').on('change', function () {
                showDriverFields($(this).val());
            });

            $('#testButton').on('click', saveAndTestSettings);
            $('#saveButton').on('click', function () {
                saveSettings().done(function () {
                    swal({
                        title: 'Success',
                        text: 'Mail settings have been updated successfully and the queue worker was restarted to apply these changes.',
                        type: 'success'
                    });
                });
            });
        });
    </script>
@endsection
