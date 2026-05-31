@extends('layouts.admin')

@section('title')
    Users
@endsection

@section('content-header')
    <h2 class="page-title">Users</h2>
@endsection

@section('admin-content')
    <div class="card">
        <div class="card-header">
            <h3 class="card-title">User List</h3>
            <div class="card-actions">
                <form action="{{ route('admin.users') }}" method="GET" class="d-inline-flex align-items-center me-2">
                    <div class="input-group input-group-sm" style="width: 200px;">
                        <input type="text" name="filter[email]" class="form-control" value="{{ request()->input('filter.email') }}" placeholder="Search...">
                        <button type="submit" class="btn btn-icon"><i class="ti ti-search"></i></button>
                    </div>
                </form>
                <a href="{{ route('admin.users.new') }}" class="btn btn-primary">
                    <i class="ti ti-plus me-1"></i> Create New
                </a>
            </div>
        </div>
        <div class="table-responsive">
            <table class="table table-vcenter card-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Email</th>
                        <th>Name</th>
                        <th>Username</th>
                        <th class="text-center">2FA</th>
                        <th class="text-center">Servers</th>
                        <th class="text-center">Subuser</th>
                        <th class="w-1"></th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($users as $user)
                        <tr>
                            <td><code>{{ $user->id }}</code></td>
                            <td>
                                <a href="{{ route('admin.users.view', $user->id) }}">{{ $user->email }}</a>
                                @if($user->root_admin)
                                    <span class="badge bg-warning-lt ms-1"><i class="ti ti-star"></i></span>
                                @endif
                            </td>
                            <td>{{ $user->name_last }}, {{ $user->name_first }}</td>
                            <td>{{ $user->username }}</td>
                            <td class="text-center">
                                @if($user->use_totp)
                                    <span class="badge bg-success-lt"><i class="ti ti-lock"></i></span>
                                @else
                                    <span class="badge bg-danger-lt"><i class="ti ti-lock-open"></i></span>
                                @endif
                            </td>
                            <td class="text-center">
                                <a href="{{ route('admin.servers', ['filter[owner_id]' => $user->id]) }}">{{ $user->servers_count }}</a>
                            </td>
                            <td class="text-center">{{ $user->subuser_of_count }}</td>
                            <td>
                                <span class="avatar avatar-sm" style="background-image: url(https://www.gravatar.com/avatar/{{ md5(strtolower($user->email)) }}?s=80)"></span>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        @if($users->hasPages())
            <div class="card-footer d-flex align-items-center">
                {!! $users->appends(['query' => Request::input('query')])->render() !!}
            </div>
        @endif
    </div>
@endsection
