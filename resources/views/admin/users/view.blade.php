@extends('layouts.admin')

@section('title')
    User — {{ $user->username }}
@endsection

@section('content-header')
    <h2 class="page-title">{{ $user->name_first }} {{ $user->name_last }}</h2>
@endsection

@section('admin-content')
    <form action="{{ route('admin.users.view', $user->id) }}" method="post">
        {!! csrf_field() !!}
        {!! method_field('PATCH') !!}
        <div class="row">
            <div class="col-lg-6">
                <div class="card mb-3">
                    <div class="card-header">
                        <h3 class="card-title">Identity</h3>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="form-label">Email</label>
                            <input type="email" name="email" value="{{ $user->email }}" class="form-control" autocomplete="off">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Username</label>
                            <input type="text" name="username" value="{{ $user->username }}" class="form-control" autocomplete="off">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">First Name</label>
                            <input type="text" name="name_first" value="{{ $user->name_first }}" class="form-control" autocomplete="off">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Last Name</label>
                            <input type="text" name="name_last" value="{{ $user->name_last }}" class="form-control" autocomplete="off">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Default Language</label>
                            <select name="language" class="form-select">
                                @foreach($languages as $key => $value)
                                    <option value="{{ $key }}" @if($user->language === $key) selected @endif>{{ $value }}</option>
                                @endforeach
                            </select>
                        </div>
                    </div>
                    <div class="card-footer text-end">
                        <button type="submit" class="btn btn-primary">
                            <i class="ti ti-device-floppy me-1"></i> Update User
                        </button>
                    </div>
                </div>
            </div>
            <div class="col-lg-6">
                <div class="card mb-3">
                    <div class="card-header">
                        <h3 class="card-title">Password</h3>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="form-label">Password</label>
                            <input type="password" name="password" class="form-control" autocomplete="off">
                            <span class="form-hint">Leave blank to keep the current password. User will not be notified of changes.</span>
                        </div>
                    </div>
                </div>
                <div class="card mb-3">
                    <div class="card-header">
                        <h3 class="card-title">Permissions</h3>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="form-label">Administrator</label>
                            <select name="root_admin" class="form-select">
                                <option value="0">No</option>
                                <option value="1" {{ $user->root_admin ? 'selected' : '' }}>Yes</option>
                            </select>
                            <span class="form-hint">Setting this to 'Yes' gives a user full administrative access.</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </form>
    <div class="row">
        <div class="col-lg-12">
            <div class="card border-danger mt-3">
                <div class="card-header">
                    <h3 class="card-title text-danger">Delete User</h3>
                </div>
                <div class="card-body">
                    <p class="mb-0">There must be no servers associated with this account in order for it to be deleted.</p>
                </div>
                <div class="card-footer">
                    <form action="{{ route('admin.users.view', $user->id) }}" method="POST">
                        {!! csrf_field() !!}
                        {!! method_field('DELETE') !!}
                        <button type="submit" class="btn btn-outline-danger float-end" {{ $user->servers->count() < 1 ?: 'disabled' }}>
                            <i class="ti ti-trash me-1"></i> Delete User
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
@endsection
