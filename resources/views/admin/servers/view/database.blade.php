@extends('layouts.admin')

@section('title')
    Server — {{ $server->name }}: Databases
@endsection

@section('content-header')
    <h2 class="page-title">{{ $server->name }}: Databases</h2>
@endsection

@section('admin-content')
@include('admin.servers.partials.navigation')
<div class="row">
    <div class="col-lg-7">
        <div class="alert alert-warning"><i class="ti ti-alert-triangle me-2"></i> Database passwords can be viewed when <a href="/server/{{ $server->uuidShort }}/databases">visiting this server</a> on the front-end.</div>
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Active Databases</h3>
            </div>
            <div class="table-responsive">
                <table class="table table-vcenter card-table">
                    <thead>
                        <tr>
                            <th>Database</th>
                            <th>Username</th>
                            <th>Connections From</th>
                            <th>Host</th>
                            <th>Max Connections</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($server->databases as $database)
                            <tr>
                                <td>{{ $database->database }}</td>
                                <td>{{ $database->username }}</td>
                                <td>{{ $database->remote }}</td>
                                <td><code>{{ $database->host->host }}:{{ $database->host->port }}</code></td>
                                @if($database->max_connections != null)
                                    <td>{{ $database->max_connections }}</td>
                                @else
                                    <td>Unlimited</td>
                                @endif
                                <td class="text-center">
                                    <button data-action="reset-password" data-id="{{ $database->id }}" class="btn btn-sm btn-primary"><i class="ti ti-refresh"></i></button>
                                    <button data-action="remove" data-id="{{ $database->id }}" class="btn btn-sm btn-outline-danger"><i class="ti ti-trash"></i></button>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    <div class="col-lg-5">
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Create New Database</h3>
            </div>
            <form action="{{ route('admin.servers.view.database', $server->id) }}" method="POST">
                <div class="card-body">
                    <div class="mb-3">
                        <label for="pDatabaseHostId" class="form-label">Database Host</label>
                        <select id="pDatabaseHostId" name="database_host_id" class="form-select">
                            @foreach($hosts as $host)
                                <option value="{{ $host->id }}">{{ $host->name }}</option>
                            @endforeach
                        </select>
                        <span class="form-hint">Select the host database server that this database should be created on.</span>
                    </div>
                    <div class="mb-3">
                        <label for="pDatabaseName" class="form-label">Database</label>
                        <div class="input-group">
                            <span class="input-group-text">s{{ $server->id }}_</span>
                            <input id="pDatabaseName" type="text" name="database" class="form-control" placeholder="database" />
                        </div>
                    </div>
                    <div class="mb-3">
                        <label for="pRemote" class="form-label">Connections</label>
                        <input id="pRemote" type="text" name="remote" class="form-control" value="%" />
                        <span class="form-hint">This should reflect the IP address that connections are allowed from. Uses standard MySQL notation. If unsure leave as <code>%</code>.</span>
                    </div>
                    <div class="mb-3">
                        <label for="pmax_connections" class="form-label">Concurrent Connections</label>
                        <input id="pmax_connections" type="text" name="max_connections" class="form-control"/>
                        <span class="form-hint">This should reflect the max number of concurrent connections from this user to the database. Leave empty for unlimited.</span>
                    </div>
                </div>
                <div class="card-footer">
                    {!! csrf_field() !!}
                    <span class="form-hint">A username and password for this database will be randomly generated after form submission.</span>
                    <button type="submit" class="btn btn-primary float-end"><i class="ti ti-device-floppy me-1"></i> Save</button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection

@section('admin-js')
    <script>
    $('#pDatabaseHost').select2();
    $('[data-action="remove"]').click(function (event) {
        event.preventDefault();
        var self = $(this);
        swal({
            title: '',
            type: 'warning',
            text: 'Are you sure that you want to delete this database? There is no going back, all data will immediately be removed.',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            confirmButtonColor: '#d9534f',
            closeOnConfirm: false,
            showLoaderOnConfirm: true,
        }, function () {
            $.ajax({
                method: 'DELETE',
                url: '/admin/servers/view/{{ $server->id }}/database/' + self.data('id') + '/delete',
                headers: { 'X-CSRF-TOKEN': $('meta[name="_token"]').attr('content') },
            }).done(function () {
                self.parent().parent().slideUp();
                swal.close();
            }).fail(function (jqXHR) {
                console.error(jqXHR);
                swal({
                    type: 'error',
                    title: 'Whoops!',
                    text: (typeof jqXHR.responseJSON.error !== 'undefined') ? jqXHR.responseJSON.error : 'An error occurred while processing this request.'
                });
            });
        });
    });
    $('[data-action="reset-password"]').click(function (e) {
        e.preventDefault();
        var block = $(this);
        $(this).addClass('disabled').find('i').addClass('ti-spin');
        $.ajax({
            type: 'PATCH',
            url: '/admin/servers/view/{{ $server->id }}/database',
            headers: { 'X-CSRF-TOKEN': $('meta[name="_token"]').attr('content') },
            data: { database: $(this).data('id') },
        }).done(function (data) {
            swal({
                type: 'success',
                title: '',
                text: 'The password for this database has been reset.',
            });
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.error(jqXHR);
            var error = 'An error occurred while trying to process this request.';
            if (typeof jqXHR.responseJSON !== 'undefined' && typeof jqXHR.responseJSON.error !== 'undefined') {
                error = jqXHR.responseJSON.error;
            }
            swal({
                type: 'error',
                title: 'Whoops!',
                text: error
            });
        }).always(function () {
            block.removeClass('disabled').find('i').removeClass('ti-spin');
        });
    });
    </script>
@endsection
