@extends('layouts.admin')
@include('partials/admin.settings.nav', ['activeTab' => 'mail'])

@section('title')
    Mail Settings
@endsection

@section('content-header')
    <h1>Mail Settings<small>Configure how the panel should handle sending emails.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li class="active">Settings</li>
    </ol>
@endsection

@section('content')
    @yield('settings::nav')
    <div class="row">
        <div class="col-xs-12">
            <div class="box">
                <div class="box-header with-border">
                    <h3 class="box-title">Email Settings</h3>
                </div>
                @if($disabled)
                    <div class="box-body">
                        <div class="row">
                            <div class="col-xs-12">
                                <div class="alert alert-info no-margin-bottom">
                                    Your current mail driver (<code>{{ $driver }}</code>) is not configurable through this interface.
                                    Please use <code>php artisan p:environment:mail</code> to update your mail settings, or set
                                    <code>MAIL_MAILER</code> to one of: <code>smtp</code>, <code>mailgun</code>, <code>postmark</code>, or <code>resend</code>.
                                </div>
                            </div>
                        </div>
                    </div>
                @else
                    <form>
                        <div class="box-body">
                            {{-- Provider Selector --}}
                            <div class="row">
                                <div class="form-group col-md-6">
                                    <label class="control-label">Mail Provider</label>
                                    <div>
                                        <select name="mail:default" id="mail-driver-select" class="form-control">
                                            <option value="smtp" @if($driver === 'smtp') selected @endif>SMTP</option>
                                            <option value="mailgun" @if($driver === 'mailgun') selected @endif>Mailgun</option>
                                            <option value="postmark" @if($driver === 'postmark') selected @endif>Postmark</option>
                                            <option value="resend" @if($driver === 'resend') selected @endif>Resend</option>
                                        </select>
                                        <p class="text-muted small">Select the mail provider you want to use for sending emails.</p>
                                    </div>
                                </div>
                            </div>

                            {{-- SMTP Fields --}}
                            <div id="driver-smtp" class="driver-fields" style="display: none;">
                                <div class="row">
                                    <div class="form-group col-md-6">
                                        <label class="control-label">SMTP Host</label>
                                        <div>
                                            <input type="text" class="form-control" name="mail:mailers:smtp:host" value="{{ old('mail:mailers:smtp:host', config('mail.mailers.smtp.host')) }}" />
                                            <p class="text-muted small">Enter the SMTP server address that mail should be sent through.</p>
                                        </div>
                                    </div>
                                    <div class="form-group col-md-2">
                                        <label class="control-label">SMTP Port</label>
                                        <div>
                                            <input type="number" class="form-control" name="mail:mailers:smtp:port" value="{{ old('mail:mailers:smtp:port', config('mail.mailers.smtp.port')) }}" />
                                            <p class="text-muted small">The SMTP server port.</p>
                                        </div>
                                    </div>
                                    <div class="form-group col-md-4">
                                        <label class="control-label">Encryption</label>
                                        <div>
                                            @php
                                                $encryption = old('mail:mailers:smtp:encryption', config('mail.mailers.smtp.encryption'));
                                            @endphp
                                            <select name="mail:mailers:smtp:encryption" class="form-control">
                                                <option value="" @if($encryption === '' || $encryption === null) selected @endif>None</option>
                                                <option value="tls" @if($encryption === 'tls') selected @endif>Transport Layer Security (TLS)</option>
                                                <option value="ssl" @if($encryption === 'ssl') selected @endif>Secure Sockets Layer (SSL)</option>
                                            </select>
                                            <p class="text-muted small">Select the type of encryption to use when sending mail.</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="form-group col-md-6">
                                        <label class="control-label">Username <span class="field-optional"></span></label>
                                        <div>
                                            <input type="text" class="form-control" name="mail:mailers:smtp:username" value="{{ old('mail:mailers:smtp:username', config('mail.mailers.smtp.username')) }}" />
                                            <p class="text-muted small">The username to use when connecting to the SMTP server.</p>
                                        </div>
                                    </div>
                                    <div class="form-group col-md-6">
                                        <label class="control-label">Password <span class="field-optional"></span></label>
                                        <div>
                                            <input type="password" class="form-control" name="mail:mailers:smtp:password" />
                                            <p class="text-muted small">The password for the SMTP server. Leave blank to keep the existing password. Enter <code>!e</code> to clear it.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {{-- Mailgun Fields --}}
                            <div id="driver-mailgun" class="driver-fields" style="display: none;">
                                <div class="row">
                                    <div class="form-group col-md-6">
                                        <label class="control-label">Mailgun Domain</label>
                                        <div>
                                            <input type="text" class="form-control" name="services:mailgun:domain" value="{{ old('services:mailgun:domain', config('services.mailgun.domain')) }}" />
                                            <p class="text-muted small">Your Mailgun sending domain (e.g. <code>mg.example.com</code>).</p>
                                        </div>
                                    </div>
                                    <div class="form-group col-md-6">
                                        <label class="control-label">Mailgun API Key</label>
                                        <div>
                                            <input type="password" class="form-control" name="services:mailgun:secret" />
                                            <p class="text-muted small">Your Mailgun API key. Leave blank to keep the existing key.</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="form-group col-md-6">
                                        <label class="control-label">Mailgun Endpoint</label>
                                        <div>
                                            <input type="text" class="form-control" name="services:mailgun:endpoint" value="{{ old('services:mailgun:endpoint', config('services.mailgun.endpoint', 'api.mailgun.net')) }}" />
                                            <p class="text-muted small">The Mailgun API endpoint. Use <code>api.eu.mailgun.net</code> for EU region.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {{-- Postmark Fields --}}
                            <div id="driver-postmark" class="driver-fields" style="display: none;">
                                <div class="row">
                                    <div class="form-group col-md-6">
                                        <label class="control-label">Postmark Server Token</label>
                                        <div>
                                            <input type="password" class="form-control" name="services:postmark:token" />
                                            <p class="text-muted small">Your Postmark server API token. Leave blank to keep the existing token.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {{-- Resend Fields --}}
                            <div id="driver-resend" class="driver-fields" style="display: none;">
                                <div class="row">
                                    <div class="form-group col-md-6">
                                        <label class="control-label">Resend API Key</label>
                                        <div>
                                            <input type="password" class="form-control" name="services:resend:key" />
                                            <p class="text-muted small">Your Resend API key. Leave blank to keep the existing key. Get one at <a href="https://resend.com/api-keys" target="_blank">resend.com/api-keys</a>.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {{-- From Address (shared by all providers) --}}
                            <div class="row" style="margin-top: 15px;">
                                <div class="form-group col-md-6">
                                    <label class="control-label">Mail From Address</label>
                                    <div>
                                        <input required type="email" class="form-control" name="mail:from:address" value="{{ old('mail:from:address', config('mail.from.address')) }}" />
                                        <p class="text-muted small">Enter an email address that all outgoing emails will originate from.</p>
                                    </div>
                                </div>
                                <div class="form-group col-md-6">
                                    <label class="control-label">Mail From Name <span class="field-optional"></span></label>
                                    <div>
                                        <input type="text" class="form-control" name="mail:from:name" value="{{ old('mail:from:name', config('mail.from.name')) }}" />
                                        <p class="text-muted small">The name that emails should appear to come from.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="box-footer">
                            {{ csrf_field() }}
                            <div class="pull-right">
                                <button type="button" id="testButton" class="btn btn-sm btn-success">Test</button>
                                <button type="button" id="saveButton" class="btn btn-sm btn-primary">Save</button>
                            </div>
                        </div>
                    </form>
                @endif
            </div>
        </div>
    </div>
@endsection

@section('footer-scripts')
    @parent

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
            // Show the correct driver fields on page load.
            showDriverFields($('#mail-driver-select').val());

            // Switch fields when the provider dropdown changes.
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
