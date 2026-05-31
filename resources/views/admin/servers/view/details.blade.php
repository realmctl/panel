@extends('layouts.admin')

@section('title')
    Server — {{ $server->name }}: Details
@endsection

@section('content-header')
    <h2 class="page-title">{{ $server->name }}: Details</h2>
@endsection

@section('admin-content')
@include('admin.servers.partials.navigation')
<div class="row">
    <div class="col-lg-12">
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Base Information</h3>
            </div>
            <form action="{{ route('admin.servers.view.details', $server->id) }}" method="POST">
                <div class="card-body">
                    <div class="mb-3">
                        <label for="name" class="form-label">Server Name <span class="field-required"></span></label>
                        <input type="text" name="name" value="{{ old('name', $server->name) }}" class="form-control" />
                        <span class="form-hint">Character limits: <code>a-zA-Z0-9_-</code> and <code>[Space]</code>.</span>
                    </div>
                    <div class="mb-3">
                        <label for="external_id" class="form-label">External Identifier</label>
                        <input type="text" name="external_id" value="{{ old('external_id', $server->external_id) }}" class="form-control" />
                        <span class="form-hint">Leave empty to not assign an external identifier for this server. The external ID should be unique to this server and not be in use by any other servers.</span>
                    </div>
                    <div class="mb-3">
                        <label for="pUserId" class="form-label">Server Owner <span class="field-required"></span></label>
                        <select name="owner_id" class="form-control" id="pUserId">
                            <option value="{{ $server->owner_id }}" selected>{{ $server->user->email }}</option>
                        </select>
                        <span class="form-hint">You can change the owner of this server by changing this field to an email matching another use on this system. If you do this a new daemon security token will be generated automatically.</span>
                    </div>
                    <div class="mb-3">
                        <label for="description" class="form-label">Server Description</label>
                        <textarea name="description" rows="3" class="form-control">{{ old('description', $server->description) }}</textarea>
                        <span class="form-hint">A brief description of this server.</span>
                    </div>
                </div>
                <div class="card-footer">
                    {!! csrf_field() !!}
                    {!! method_field('PATCH') !!}
                    <button type="submit" class="btn btn-primary"><i class="ti ti-device-floppy me-1"></i> Update Details</button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection

@section('admin-js')
    <script>
    function escapeHtml(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    $('#pUserId').select2({
        ajax: {
            url: '/admin/users/accounts.json',
            dataType: 'json',
            delay: 250,
            data: function (params) {
                return {
                    filter: { email: params.term },
                    page: params.page,
                };
            },
            processResults: function (data, params) {
                return { results: data };
            },
            cache: true,
        },
        escapeMarkup: function (markup) { return markup; },
        minimumInputLength: 2,
        templateResult: function (data) {
            if (data.loading) return escapeHtml(data.text);

            return '<div class="user-block"> \
                <img class="img-circle img-bordered-xs" src="https://www.gravatar.com/avatar/' + escapeHtml(data.md5) + '?s=120" alt="User Image"> \
                <span class="username"> \
                    <a href="#">' + escapeHtml(data.name_first) + ' ' + escapeHtml(data.name_last) +'</a> \
                </span> \
                <span class="description"><strong>' + escapeHtml(data.email) + '</strong> - ' + escapeHtml(data.username) + '</span> \
            </div>';
        },
        templateSelection: function (data) {
            if (typeof data.name_first === 'undefined') {
                data = {
                    md5: '{{ md5(strtolower($server->user->email)) }}',
                    name_first: '{{ $server->user->name_first }}',
                    name_last: '{{ $server->user->name_last }}',
                    email: '{{ $server->user->email }}',
                    id: {{ $server->owner_id }}
                };
            }

            return '<div> \
                <span> \
                    <img class="img-rounded img-bordered-xs" src="https://www.gravatar.com/avatar/' + escapeHtml(data.md5) + '?s=120" style="height:28px;margin-top:-4px;" alt="User Image"> \
                </span> \
                <span style="padding-left:5px;"> \
                    ' + escapeHtml(data.name_first) + ' ' + escapeHtml(data.name_last) + ' (<strong>' + escapeHtml(data.email) + '</strong>) \
                </span> \
            </div>';
        }
    });
    </script>
@endsection
