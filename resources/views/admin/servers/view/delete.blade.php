@extends('layouts.admin')

@section('title')
    Server — {{ $server->name }}: Delete
@endsection

@section('content-header')
    <h2 class="page-title">{{ $server->name }}: Delete</h2>
@endsection

@section('admin-content')
@include('admin.servers.partials.navigation')
<div class="row">
    <div class="col-lg-6">
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Safely Delete Server</h3>
            </div>
            <div class="card-body">
                <p>This action will attempt to delete the server from both the panel and daemon. If either one reports an error the action will be cancelled.</p>
                <div class="alert alert-danger">
                    <i class="ti ti-alert-triangle me-2"></i>
                    Deleting a server is irreversible. <strong>All server data</strong> (including files and users) will be removed.
                </div>
            </div>
            <div class="card-footer">
                <form id="deleteform" action="{{ route('admin.servers.view.delete', $server->id) }}" method="POST">
                    {!! csrf_field() !!}
                    <button id="deletebtn" type="button" class="btn btn-danger w-100">
                        <i class="ti ti-trash me-1"></i> Safely Delete This Server
                    </button>
                </form>
            </div>
        </div>
    </div>
    <div class="col-lg-6">
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Force Delete Server</h3>
            </div>
            <div class="card-body">
                <p>This action will attempt to delete the server from both the panel and daemon. If the daemon does not respond, or reports an error, the deletion will continue.</p>
                <div class="alert alert-danger">
                    <i class="ti ti-alert-triangle me-2"></i>
                    This method may leave dangling files on your daemon if it reports an error. <strong>All server data</strong> will be removed from the panel.
                </div>
            </div>
            <div class="card-footer">
                <form id="forcedeleteform" action="{{ route('admin.servers.view.delete', $server->id) }}" method="POST">
                    {!! csrf_field() !!}
                    <input type="hidden" name="force_delete" value="1" />
                    <button id="forcedeletebtn" type="button" class="btn btn-outline-danger w-100">
                        <i class="ti ti-trash me-1"></i> Forcibly Delete This Server
                    </button>
                </form>
            </div>
        </div>
    </div>
</div>
@endsection

@section('admin-js')
    <script>
    $('#deletebtn').click(function (event) {
        event.preventDefault();
        swal({
            title: '',
            type: 'warning',
            text: 'Are you sure you want to delete this server? There is no going back, all data will immediately be removed.',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            confirmButtonColor: '#d9534f',
            closeOnConfirm: false
        }, function () {
            $('#deleteform').submit()
        });
    });

    $('#forcedeletebtn').click(function (event) {
        event.preventDefault();
        swal({
            title: '',
            type: 'warning',
            text: 'Are you sure you want to forcibly delete this server? There is no going back, all data will immediately be removed.',
            showCancelButton: true,
            confirmButtonText: 'Force Delete',
            confirmButtonColor: '#d9534f',
            closeOnConfirm: false
        }, function () {
            $('#forcedeleteform').submit()
        });
    });
    </script>
@endsection
