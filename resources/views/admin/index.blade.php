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
        <div class="card{{ $version->isLatestPanel() ? ' card-borderless' : '' }}">
            <div class="card-status-start {{ $version->isLatestPanel() ? 'bg-success' : 'bg-danger' }}"></div>
            <div class="card-body">
                <div class="d-flex align-items-center">
                    <div class="subheader me-3">
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

    {{-- Quick Links --}}
    <div class="col-sm-6 col-lg-3">
        <a href="{{ $version->getDiscord() }}" class="card card-link card-link-pop" target="_blank">
            <div class="card-body">
                <div class="d-flex align-items-center">
                    <span class="avatar bg-warning-lt me-3">
                        <i class="ti ti-lifebuoy"></i>
                    </span>
                    <div>
                        <div class="fw-bold">Get Help</div>
                        <div class="text-secondary small">via Discord</div>
                    </div>
                </div>
            </div>
        </a>
    </div>
    <div class="col-sm-6 col-lg-3">
        <a href="https://realmctl.com" class="card card-link card-link-pop" target="_blank">
            <div class="card-body">
                <div class="d-flex align-items-center">
                    <span class="avatar bg-primary-lt me-3">
                        <i class="ti ti-book"></i>
                    </span>
                    <div>
                        <div class="fw-bold">Documentation</div>
                        <div class="text-secondary small">realmctl.com</div>
                    </div>
                </div>
            </div>
        </a>
    </div>
    <div class="col-sm-6 col-lg-3">
        <a href="https://github.com/realmopensource/panel" class="card card-link card-link-pop" target="_blank">
            <div class="card-body">
                <div class="d-flex align-items-center">
                    <span class="avatar bg-secondary-lt me-3">
                        <i class="ti ti-brand-github"></i>
                    </span>
                    <div>
                        <div class="fw-bold">GitHub</div>
                        <div class="text-secondary small">Source code</div>
                    </div>
                </div>
            </div>
        </a>
    </div>
    <div class="col-sm-6 col-lg-3">
        <a href="{{ $version->getDonations() }}" class="card card-link card-link-pop" target="_blank">
            <div class="card-body">
                <div class="d-flex align-items-center">
                    <span class="avatar bg-success-lt me-3">
                        <i class="ti ti-heart"></i>
                    </span>
                    <div>
                        <div class="fw-bold">Support the Project</div>
                        <div class="text-secondary small">Donate</div>
                    </div>
                </div>
            </div>
        </a>
    </div>
</div>
@endsection
