@extends('layouts.admin')

@section('title')
    Create User
@endsection

@section('content-header')
    <h2 class="page-title">Create User</h2>
@endsection

@section('admin-content')
    <form method="post">
        {{ csrf_field() }}
        <div class="row">
            <div class="col-lg-6">
                <div class="card mb-3">
                    <div class="card-header">
                        <h3 class="card-title">Identity</h3>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="form-label required">Email</label>
                            <input type="email" autocomplete="off" name="email" value="{{ old('email') }}" class="form-control" />
                        </div>
                        <div class="mb-3">
                            <label class="form-label required">Username</label>
                            <input type="text" autocomplete="off" name="username" value="{{ old('username') }}" class="form-control" />
                        </div>
                        <div class="mb-3">
                            <label class="form-label required">First Name</label>
                            <input type="text" autocomplete="off" name="name_first" value="{{ old('name_first') }}" class="form-control" />
                        </div>
                        <div class="mb-3">
                            <label class="form-label required">Last Name</label>
                            <input type="text" autocomplete="off" name="name_last" value="{{ old('name_last') }}" class="form-control" />
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Default Language</label>
                            <select name="language" class="form-select">
                                @foreach($languages as $key => $value)
                                    <option value="{{ $key }}" @if(config('app.locale') === $key) selected @endif>{{ $value }}</option>
                                @endforeach
                            </select>
                        </div>
                    </div>
                    <div class="card-footer text-end">
                        <button type="submit" class="btn btn-primary">
                            <i class="ti ti-plus me-1"></i> Create User
                        </button>
                    </div>
                </div>
            </div>
            <div class="col-lg-6">
                <div class="card mb-3">
                    <div class="card-header">
                        <h3 class="card-title">Permissions</h3>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="form-label">Administrator</label>
                            <select name="root_admin" class="form-select">
                                <option value="0">No</option>
                                <option value="1">Yes</option>
                            </select>
                            <span class="form-hint">Setting this to 'Yes' gives a user full administrative access.</span>
                        </div>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Password</h3>
                    </div>
                    <div class="card-body">
                        <div class="alert alert-info">
                            <i class="ti ti-info-circle me-2"></i>
                            Providing a password is optional. New users will be prompted to create one on first login.
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Password</label>
                            <input type="password" name="password" class="form-control" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </form>
@endsection
