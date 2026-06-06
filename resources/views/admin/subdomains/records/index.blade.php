@extends('layouts.admin')

@section('title')
    Subdomain Record Templates
@endsection

@section('content-header')
    <h2 class="page-title">Record Templates</h2>
@endsection

@section('admin-content')
    @include('partials.admin.subdomains.nav', ['activeTab' => 'records'])

    <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
            <h3 class="card-title mb-0">Record Templates</h3>
            <a href="{{ route('admin.subdomains.records.create') }}" class="btn btn-primary btn-sm">Create New</a>
        </div>
        <div class="table-responsive">
            <table class="table table-vcenter card-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Domain</th>
                        <th class="text-end">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($records as $record)
                        <tr>
                            <td><code>{{ $record->id }}</code></td>
                            <td>{{ $record->name }}</td>
                            <td>{{ $record->type }}</td>
                            <td>{{ $record->domain->name }}</td>
                            <td class="text-end">
                                <a href="{{ route('admin.subdomains.records.edit', $record->id) }}" class="btn btn-sm btn-secondary">Edit</a>
                                <button type="button" class="btn btn-sm btn-danger" data-action="remove-record" data-id="{{ $record->id }}">Delete</button>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5" class="text-center text-secondary">No record templates configured yet.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        @if ($records->hasPages())
            <div class="card-footer">{{ $records->links() }}</div>
        @endif
    </div>
@endsection

@section('admin-js')
    <script>
        $(document).ready(function () {
            $('[data-action="remove-record"]').on('click', function () {
                const id = $(this).data('id');
                const row = $(this).closest('tr');

                if (!confirm('Remove this record template?')) {
                    return;
                }

                $.ajax({
                    method: 'DELETE',
                    url: '/admin/subdomains/records/' + id,
                    headers: { 'X-CSRF-TOKEN': '{{ csrf_token() }}' },
                }).done(function () {
                    row.remove();
                }).fail(function () {
                    alert('An error occurred while removing this record template.');
                });
            });
        });
    </script>
@endsection
