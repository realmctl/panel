@extends('layouts.admin')

@section('title')
    Nests &rarr; Egg: {{ $egg->name }} &rarr; Install Script
@endsection

@section('content-header')
    <h2 class="page-title">{{ $egg->name }}</h2>
@endsection

@section('admin-content')
<ul class="nav nav-tabs mb-3">
    <li class="nav-item"><a class="nav-link" href="{{ route('admin.nests.egg.view', $egg->id) }}"><i class="ti ti-settings me-1"></i> Configuration</a></li>
    <li class="nav-item"><a class="nav-link" href="{{ route('admin.nests.egg.variables', $egg->id) }}"><i class="ti ti-variable me-1"></i> Variables</a></li>
    <li class="nav-item"><a class="nav-link active" href="{{ route('admin.nests.egg.scripts', $egg->id) }}"><i class="ti ti-script me-1"></i> Install Script</a></li>
</ul>
<form action="{{ route('admin.nests.egg.scripts', $egg->id) }}" method="POST">
    <div class="row">
        <div class="col-lg-12">
            <div class="card mb-3">
                <div class="card-header">
                    <h3 class="card-title">Install Script</h3>
                </div>
                @if(! is_null($egg->copyFrom))
                    <div class="card-body">
                        <div class="alert alert-warning mb-0">
                            <div class="d-flex">
                                <div><i class="ti ti-alert-triangle me-2"></i></div>
                                <div>This service option is copying installation scripts and container options from <a href="{{ route('admin.nests.egg.view', $egg->copyFrom->id) }}">{{ $egg->copyFrom->name }}</a>. Any changes you make to this script will not apply unless you select "None" from the dropdown box below.</div>
                            </div>
                        </div>
                    </div>
                @endif
                <div class="card-body p-0">
                    <div id="editor_install" style="height:300px">{{ $egg->script_install }}</div>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-lg-4 mb-3">
                            <label class="form-label">Copy Script From</label>
                            <select id="pCopyScriptFrom" name="copy_script_from" class="form-select">
                                <option value="">None</option>
                                @foreach($copyFromOptions as $opt)
                                    <option value="{{ $opt->id }}" {{ $egg->copy_script_from !== $opt->id ?: 'selected' }}>{{ $opt->name }}</option>
                                @endforeach
                            </select>
                            <span class="form-hint">If selected, script above will be ignored and script from selected option will be used in place.</span>
                        </div>
                        <div class="col-lg-4 mb-3">
                            <label class="form-label">Script Container</label>
                            <input type="text" name="script_container" class="form-control" value="{{ $egg->script_container }}" />
                            <span class="form-hint">Docker container to use when running this script for the server.</span>
                        </div>
                        <div class="col-lg-4 mb-3">
                            <label class="form-label">Script Entrypoint Command</label>
                            <input type="text" name="script_entry" class="form-control" value="{{ $egg->script_entry }}" />
                            <span class="form-hint">The entrypoint command to use for this script.</span>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-lg-12 text-muted">
                            The following service options rely on this script:
                            @if(count($relyOnScript) > 0)
                                @foreach($relyOnScript as $rely)
                                    <a href="{{ route('admin.nests.egg.view', $rely->id) }}">
                                        <code>{{ $rely->name }}</code>@if(!$loop->last),&nbsp;@endif
                                    </a>
                                @endforeach
                            @else
                                <em>none</em>
                            @endif
                        </div>
                    </div>
                </div>
                <div class="card-footer text-end">
                    {!! csrf_field() !!}
                    <textarea name="script_install" class="hidden"></textarea>
                    <button type="submit" name="_method" value="PATCH" class="btn btn-primary"><i class="ti ti-device-floppy me-1"></i> Save</button>
                </div>
            </div>
        </div>
    </div>
</form>
@endsection

@section('admin-js')
    {!! Theme::js('vendor/ace/ace.js') !!}
    {!! Theme::js('vendor/ace/ext-modelist.js') !!}
    <script>
    $(document).ready(function () {
        $('#pCopyScriptFrom').select2();

        const InstallEditor = ace.edit('editor_install');
        const Modelist = ace.require('ace/ext/modelist')

        InstallEditor.setTheme('ace/theme/chrome');
        InstallEditor.getSession().setMode('ace/mode/sh');
        InstallEditor.getSession().setUseWrapMode(true);
        InstallEditor.setShowPrintMargin(false);

        $('form').on('submit', function (e) {
            $('textarea[name="script_install"]').val(InstallEditor.getValue());
        });
    });
    </script>
@endsection
