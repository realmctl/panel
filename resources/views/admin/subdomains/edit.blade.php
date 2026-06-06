@extends('layouts.admin')

@section('title')
    Edit Subdomain Domain
@endsection

@section('content-header')
    <h2 class="page-title">Edit Domain</h2>
@endsection

@section('admin-content')
    @include('partials.admin.subdomains.nav', ['activeTab' => 'domains'])

    <form action="{{ route('admin.subdomains.update', $domain->id) }}" method="POST">
        @csrf
        @method('PATCH')
        @include('admin.subdomains._form', ['providers' => $providers, 'domain' => $domain])
        <div class="card-footer text-end">
            <button type="submit" class="btn btn-primary">Save</button>
        </div>
    </form>
@endsection

@section('admin-js')
    <script>
        $(document).ready(function () {
            const providers = @json($providers);

            function toggleFields(type) {
                const provider = providers[type];
                $('#field-secret').toggle(provider.secret);
                $('#field-consumer').toggle(provider.consumer);
                $('#field-cloudflare-id').toggle(provider.cloudflare_id);
                $('#field-ovh-api').toggle(provider.ovh_api);
            }

            toggleFields($('#provider-type').val());
            $('#provider-type').on('change', function () {
                toggleFields($(this).val());
            });
        });
    </script>
@endsection
