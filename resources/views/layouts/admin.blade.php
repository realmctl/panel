@extends('tablar::page')

@section('title')
    @yield('title')
@endsection

@section('content')
    <!-- Page header -->
    <div class="page-header d-print-none">
        <div class="container-xl">
            <div class="row g-2 align-items-center">
                <div class="col">
                    <div class="page-pretitle">Administration</div>
                    @yield('content-header')
                </div>
            </div>
        </div>
    </div>
    <!-- Page body -->
    <div class="page-body">
        <div class="container-xl">
            @if (count($errors) > 0)
                <div class="alert alert-danger mb-3">
                    <h4 class="alert-title">Validation Error</h4>
                    <ul class="mb-0">
                        @foreach ($errors->all() as $error)
                            <li>{{ $error }}</li>
                        @endforeach
                    </ul>
                </div>
            @endif
            @foreach (Alert::getMessages() as $type => $messages)
                @foreach ($messages as $message)
                    <div class="alert alert-{{ $type }} alert-dismissible mb-3" role="alert">
                        {{ $message }}
                        <a class="btn-close" data-bs-dismiss="alert" aria-label="close"></a>
                    </div>
                @endforeach
            @endforeach
            @yield('admin-content')
        </div>
    </div>
@endsection

@section('css')
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.31.0/tabler-icons.min.css">
    {!! Theme::css('vendor/sweetalert/sweetalert.min.css?t={cache-version}') !!}
    {!! Theme::css('vendor/select2/select2.min.css?t={cache-version}') !!}
    @yield('admin-css')
@endsection

@section('js')
    {!! Theme::js('vendor/jquery/jquery.min.js?t={cache-version}') !!}
    {!! Theme::js('vendor/sweetalert/sweetalert.min.js?t={cache-version}') !!}
    {!! Theme::js('vendor/select2/select2.full.min.js?t={cache-version}') !!}
    {!! Theme::js('js/admin/functions.js?t={cache-version}') !!}
    @yield('admin-js')
@endsection
