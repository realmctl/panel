@extends('layouts.admin')

@section('title')
    Application API
@endsection

@section('content-header')
    <h2 class="page-title">Application API</h2>
@endsection

@section('admin-content')
    <div class="card">
        <div class="card-header">
            <h3 class="card-title">API Credentials</h3>
            <div class="card-actions">
                <a href="{{ route('admin.api.new') }}" class="btn btn-primary">
                    <i class="ti ti-plus me-1"></i> Create New
                </a>
            </div>
        </div>
        <div class="table-responsive">
            <table class="table table-vcenter card-table">
                <thead>
                    <tr>
                        <th>Key</th>
                        <th>Memo</th>
                        <th>Last Used</th>
                        <th>Created</th>
                        <th>Created by</th>
                        <th class="w-1"></th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($keys as $key)
                        <tr>
                            <td>
                                <code>
                                    @if (Auth::user()->is($key->user))
                                        {{ $key->identifier . decrypt($key->token) }}
                                    @else
                                        {{ $key->identifier . '****' }}
                                    @endif
                                </code>
                            </td>
                            <td>{{ $key->memo }}</td>
                            <td class="text-secondary">
                                @if(!is_null($key->last_used_at))
                                    @datetimeHuman($key->last_used_at)
                                @else
                                    &mdash;
                                @endif
                            </td>
                            <td class="text-secondary">@datetimeHuman($key->created_at)</td>
                            <td>
                                <a href="{{ route('admin.users.view', $key->user->id) }}">{{ $key->user->username }}</a>
                            </td>
                            <td>
                                <a href="#" class="btn btn-ghost-danger btn-icon" data-action="revoke-key" data-attr="{{ $key->identifier }}" title="Revoke">
                                    <i class="ti ti-trash"></i>
                                </a>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        @if($keys->isEmpty())
            <div class="card-body">
                <div class="empty">
                    <div class="empty-icon"><i class="ti ti-key" style="font-size: 3rem;"></i></div>
                    <p class="empty-title">No API keys</p>
                    <p class="empty-subtitle text-secondary">Create your first API key to get started.</p>
                    <div class="empty-action">
                        <a href="{{ route('admin.api.new') }}" class="btn btn-primary">
                            <i class="ti ti-plus me-1"></i> Create New
                        </a>
                    </div>
                </div>
            </div>
        @endif
    </div>
@endsection

@section('admin-js')
    <script>
        $(document).ready(function() {
            $('[data-action="revoke-key"]').click(function (event) {
                var self = $(this);
                event.preventDefault();
                swal({
                    type: 'error',
                    title: 'Revoke API Key',
                    text: 'Once this API key is revoked any applications currently using it will stop working.',
                    showCancelButton: true,
                    allowOutsideClick: true,
                    closeOnConfirm: false,
                    confirmButtonText: 'Revoke',
                    confirmButtonColor: '#d9534f',
                    showLoaderOnConfirm: true
                }, function () {
                    $.ajax({
                        method: 'DELETE',
                        url: '/admin/api/revoke/' + self.data('attr'),
                        headers: {
                            'X-CSRF-TOKEN': '{{ csrf_token() }}'
                        }
                    }).done(function () {
                        swal({
                            type: 'success',
                            title: '',
                            text: 'API Key has been revoked.'
                        });
                        self.closest('tr').slideUp();
                    }).fail(function (jqXHR) {
                        console.error(jqXHR);
                        swal({
                            type: 'error',
                            title: 'Whoops!',
                            text: 'An error occurred while attempting to revoke this key.'
                        });
                    });
                });
            });
        });
    </script>
@endsection
