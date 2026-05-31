@extends('layouts.admin')

@section('title')
    Administration
@endsection

@section('content-header')
    <h2 class="page-title">Overview</h2>
@endsection

@section('admin-content')
<div class="row row-deck row-cards">
    {{-- Version Status Card --}}
    <div class="col-12">
        <div class="card">
            <div class="card-status-start {{ $version->isLatestPanel() ? 'bg-success' : 'bg-danger' }}"></div>
            <div class="card-body">
                <div class="d-flex align-items-center">
                    <div class="me-3">
                        <i class="ti ti-info-circle" style="font-size: 1.5rem;"></i>
                    </div>
                    <div>
                        <h3 class="card-title mb-1">System Information</h3>
                        @if ($version->isLatestPanel())
                            <p class="text-secondary mb-0">
                                You are running Realm Panel version <code>{{ config('app.version') }}</code>. Your panel is up-to-date.
                            </p>
                        @else
                            <p class="text-secondary mb-0">
                                Your panel is <strong>not up-to-date.</strong> The latest version is
                                <a href="https://github.com/realmopensource/panel/releases/v{{ $version->getPanel() }}" target="_blank"><code>{{ $version->getPanel() }}</code></a>
                                and you are currently running version <code>{{ config('app.version') }}</code>.
                            </p>
                        @endif
                    </div>
                </div>
            </div>
        </div>
    </div>

    {{-- Quick Actions --}}
    <div class="col-12">
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Quick Actions</h3>
            </div>
            <div class="card-body">
                <div class="btn-list">
                    <a href="{{ route('admin.servers.new') }}" class="btn">
                        <i class="ti ti-server me-1"></i> New Server
                    </a>
                    <a href="{{ route('admin.users.new') }}" class="btn">
                        <i class="ti ti-user-plus me-1"></i> New User
                    </a>
                    <a href="{{ route('admin.nodes.new') }}" class="btn">
                        <i class="ti ti-network me-1"></i> New Node
                    </a>
                    <a href="{{ route('admin.nests.egg.new') }}" class="btn">
                        <i class="ti ti-egg me-1"></i> New Egg
                    </a>
                    <a href="{{ route('admin.databases.new') }}" class="btn">
                        <i class="ti ti-database me-1"></i> New Database Host
                    </a>
                    <a href="{{ route('admin.settings') }}" class="btn">
                        <i class="ti ti-settings me-1"></i> Settings
                    </a>
                </div>
            </div>
        </div>
    </div>

    {{-- Links --}}
    <div class="col-sm-6 col-lg-3">
        <div class="card">
            <div class="card-body">
                <div class="d-flex align-items-center">
                    <span class="avatar bg-warning-lt me-3">
                        <i class="ti ti-lifebuoy"></i>
                    </span>
                    <div>
                        <a href="{{ $version->getDiscord() }}" target="_blank" class="text-reset fw-bold">Get Help</a>
                        <div class="text-secondary small">via Discord</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="col-sm-6 col-lg-3">
        <div class="card">
            <div class="card-body">
                <div class="d-flex align-items-center">
                    <span class="avatar bg-primary-lt me-3">
                        <i class="ti ti-book"></i>
                    </span>
                    <div>
                        <a href="https://realmctl.com" target="_blank" class="text-reset fw-bold">Documentation</a>
                        <div class="text-secondary small">realmctl.com</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="col-sm-6 col-lg-3">
        <div class="card">
            <div class="card-body">
                <div class="d-flex align-items-center">
                    <span class="avatar bg-secondary-lt me-3">
                        <i class="ti ti-brand-github"></i>
                    </span>
                    <div>
                        <a href="https://github.com/realmopensource/panel" target="_blank" class="text-reset fw-bold">GitHub</a>
                        <div class="text-secondary small">Source code</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="col-sm-6 col-lg-3">
        <div class="card">
            <div class="card-body">
                <div class="d-flex align-items-center">
                    <span class="avatar bg-success-lt me-3">
                        <i class="ti ti-heart"></i>
                    </span>
                    <div>
                        <a href="{{ $version->getDonations() }}" target="_blank" class="text-reset fw-bold">Support the Project</a>
                        <div class="text-secondary small">Donate</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
