@extends('layouts.admin')

@section('title')
    Subdomain Domains
@endsection

@section('content-header')
    <h2 class="page-title">Subdomain Manager</h2>
@endsection

@section('admin-content')
    @include('partials.admin.subdomains.nav', ['activeTab' => 'domains'])

    <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
            <h3 class="card-title mb-0">Domains</h3>
            <a href="{{ route('admin.subdomains.create') }}" class="btn btn-primary btn-sm">Create New</a>
        </div>
        <div class="table-responsive">
            <table class="table table-vcenter card-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Provider</th>
                        <th class="text-end">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($domains as $domain)
                        <tr>
                            <td><code>{{ $domain->id }}</code></td>
                            <td>{{ $domain->name }}</td>
                            <td>{{ $domain->display_type }}</td>
                            <td class="text-end">
                                <a href="{{ route('admin.subdomains.edit', $domain->id) }}" class="btn btn-sm btn-secondary">Edit</a>
                                <button type="button" class="btn btn-sm btn-danger" data-action="remove-domain" data-id="{{ $domain->id }}">Delete</button>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="4" class="text-center text-secondary">No domains configured yet.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
@endsection

@section('admin-js')
    <script>
        $(document).ready(function () {
            $('[data-action="remove-domain"]').on('click', function () {
                const id = $(this).data('id');
                const row = $(this).closest('tr');

                if (!confirm('Remove this domain? All related subdomains and record templates will also be deleted.')) {
                    return;
                }

                $.ajax({
                    method: 'DELETE',
                    url: '/admin/subdomains/' + id,
                    headers: { 'X-CSRF-TOKEN': '{{ csrf_token() }}' },
                }).done(function () {
                    row.remove();
                }).fail(function () {
                    alert('An error occurred while removing this domain.');
                });
            });
        });
    </script>
@endsection
