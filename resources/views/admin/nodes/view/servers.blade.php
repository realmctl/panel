@extends('layouts.admin')

@section('title')
    {{ $node->name }}: Servers
@endsection

@section('content-header')
    <h2 class="page-title">{{ $node->name }} — Servers</h2>
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
                <a class="nav-link" href="{{ route('admin.nodes.view.configuration', $node->id) }}">Configuration</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="{{ route('admin.nodes.view.allocation', $node->id) }}">Allocation</a>
            </li>
            <li class="nav-item">
                <a class="nav-link active" href="{{ route('admin.nodes.view.servers', $node->id) }}">Servers</a>
            </li>
        </ul>
    </div>
</div>
<div class="row">
    <div class="col-lg-12">
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Server List</h3>
            </div>
            <div class="table-responsive">
                <table class="table table-vcenter card-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Server Name</th>
                            <th>Owner</th>
                            <th>Service</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($servers as $server)
                            <tr data-server="{{ $server->uuid }}">
                                <td><code>{{ $server->uuidShort }}</code></td>
                                <td><a href="{{ route('admin.servers.view', $server->id) }}">{{ $server->name }}</a></td>
                                <td><a href="{{ route('admin.users.view', $server->owner_id) }}">{{ $server->user->username }}</a></td>
                                <td>{{ $server->nest->name }} ({{ $server->egg->name }})</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
            @if($servers->hasPages())
                <div class="card-footer text-center">
                    {!! $servers->render() !!}
                </div>
            @endif
        </div>
    </div>
</div>
@endsection
