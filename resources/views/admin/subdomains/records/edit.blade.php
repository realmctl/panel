@extends('layouts.admin')

@section('title')
    Edit Record Template
@endsection

@section('content-header')
    <h2 class="page-title">Edit Record Template</h2>
@endsection

@section('admin-content')
    @include('partials.admin.subdomains.nav', ['activeTab' => 'records'])

    <form action="{{ route('admin.subdomains.records.update', $record->id) }}" method="POST">
        @csrf
        @method('PATCH')
        @include('admin.subdomains.records._form', [
            'record' => $record,
            'domains' => $domains,
            'eggs' => $eggs,
            'selectedEggs' => $selectedEggs,
        ])
        <div class="card-footer text-end">
            <button type="submit" class="btn btn-primary">Save</button>
        </div>
    </form>
@endsection

@section('admin-js')
    <script>
        $(document).ready(function () {
            $('#egg-select').select2();

            function toggleSrvFields(type) {
                const show = type === 'SRV';
                $('#srv-fields').toggle(show);
                $('#ttl, #protocol, #priority, #weight, #service').prop('required', show);
            }

            toggleSrvFields($('#record-type').val());
            $('#record-type').on('change', function () {
                toggleSrvFields($(this).val());
            });
        });
    </script>
@endsection
