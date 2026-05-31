@extends('layouts.admin')

@section('title')
    {{ $node->name }}: Configuration
@endsection

@section('content-header')
    <h2 class="page-title">{{ $node->name }} — Configuration</h2>
@endsection

@section('admin-content')
<div class="row mb-3">
    <div class="col-lg-12">
        <ul class="nav nav-tabs">
            <li class="nav-item">
                <a class="nav-link" href="{{ route('admin.nodes.view', $node->id) }}">About</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="{{ route('admin.nodes.view.settings', $node->id) }}">Settings</a>
            </li>
            <li class="nav-item">
                <a class="nav-link active" href="{{ route('admin.nodes.view.configuration', $node->id) }}">Configuration</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="{{ route('admin.nodes.view.allocation', $node->id) }}">Allocation</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="{{ route('admin.nodes.view.servers', $node->id) }}">Servers</a>
            </li>
        </ul>
    </div>
</div>
<div class="row">
    <div class="col-lg-8">
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Configuration File</h3>
                <div class="card-actions">
                    <button type="button" class="btn btn-sm" id="copyConfigBtn">
                        <i class="ti ti-copy me-1"></i> Copy
                    </button>
                </div>
            </div>
            <div class="card-body">
                <pre class="mb-0" id="configContent">{{ $node->getYamlConfiguration() }}</pre>
            </div>
            <div class="card-footer">
                <p class="mb-0">This file should be placed in your daemon's root directory (usually <code>/etc/pterodactyl</code>) in a file called <code>config.yml</code>.</p>
            </div>
        </div>
    </div>
    <div class="col-lg-4">
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Auto-Deploy</h3>
            </div>
            <div class="card-body">
                <small class="form-hint">
                    Use the button below to generate a custom deployment command that can be used to configure
                    wings on the target server with a single command.
                </small>
            </div>
            <div class="card-footer">
                <button type="button" id="configTokenBtn" class="btn btn-primary w-100">
                    <i class="ti ti-key me-1"></i> Generate Token
                </button>
            </div>
        </div>
    </div>
</div>
@endsection

@section('admin-js')
    <script>
    $('#copyConfigBtn').on('click', function () {
        var text = document.getElementById('configContent').textContent;
        navigator.clipboard.writeText(text).then(function () {
            var btn = $('#copyConfigBtn');
            btn.html('<i class="ti ti-check me-1"></i> Copied!');
            setTimeout(function () {
                btn.html('<i class="ti ti-copy me-1"></i> Copy');
            }, 2000);
        });
    });

    $('#configTokenBtn').on('click', function (event) {
        $.ajax({
            method: 'POST',
            url: '{{ route('admin.nodes.view.configuration.token', $node->id) }}',
            headers: { 'X-CSRF-TOKEN': '{{ csrf_token() }}' },
        }).done(function (data) {
            swal({
                type: 'success',
                title: 'Token created.',
                text: '<p>To auto-configure your node run the following command:<br /><small><pre>cd /etc/pterodactyl && sudo wings configure --panel-url {{ config('app.url') }} --token ' + data.token + ' --node ' + data.node + '{{ config('app.debug') ? ' --allow-insecure' : '' }}</pre></small></p>',
                html: true
            })
        }).fail(function () {
            swal({
                title: 'Error',
                text: 'Something went wrong creating your token.',
                type: 'error'
            });
        });
    });
    </script>
@endsection
