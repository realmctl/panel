@extends('layouts.admin')

@section('title')
    Nodes
@endsection

@section('content-header')
    <h2 class="page-title">Nodes</h2>
@endsection

@section('admin-content')
    <div class="card">
        <div class="card-header">
            <h3 class="card-title">Node List</h3>
            <div class="card-actions">
                <form action="{{ route('admin.nodes') }}" method="GET" class="d-inline-flex align-items-center me-2">
                    <div class="input-group input-group-sm" style="width: 200px;">
                        <input type="text" name="filter[name]" class="form-control" value="{{ request()->input('filter.name') }}" placeholder="Search...">
                        <button type="submit" class="btn btn-icon"><i class="ti ti-search"></i></button>
                    </div>
                </form>
                <a href="{{ route('admin.nodes.new') }}" class="btn btn-primary">
                    <i class="ti ti-plus me-1"></i> Create New
                </a>
            </div>
        </div>
        <div class="table-responsive">
            <table class="table table-vcenter card-table">
                <thead>
                    <tr>
                        <th class="w-1"></th>
                        <th>Name</th>
                        <th>Location</th>
                        <th>Memory</th>
                        <th>Disk</th>
                        <th class="text-center">Servers</th>
                        <th class="text-center">SSL</th>
                        <th class="text-center">Public</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($nodes as $node)
                        <tr>
                            <td class="text-center" data-action="ping" data-secret="{{ $node->getDecryptedKey() }}" data-location="{{ $node->scheme }}://{{ $node->fqdn }}:{{ $node->daemonListen }}/api/system">
                                <span class="status-dot status-dot-animated bg-secondary"></span>
                            </td>
                            <td>
                                @if($node->maintenance_mode)
                                    <span class="badge bg-warning-lt me-1"><i class="ti ti-tool"></i></span>
                                @endif
                                <a href="{{ route('admin.nodes.view', $node->id) }}">{{ $node->name }}</a>
                            </td>
                            <td class="text-secondary">{{ $node->location->short }}</td>
                            <td class="text-secondary">{{ $node->memory }} MiB</td>
                            <td class="text-secondary">{{ $node->disk }} MiB</td>
                            <td class="text-center">{{ $node->servers_count }}</td>
                            <td class="text-center">
                                @if($node->scheme === 'https')
                                    <span class="badge bg-success-lt"><i class="ti ti-lock"></i></span>
                                @else
                                    <span class="badge bg-danger-lt"><i class="ti ti-lock-open"></i></span>
                                @endif
                            </td>
                            <td class="text-center">
                                @if($node->public)
                                    <span class="badge bg-success-lt"><i class="ti ti-eye"></i></span>
                                @else
                                    <span class="badge bg-secondary-lt"><i class="ti ti-eye-off"></i></span>
                                @endif
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        @if($nodes->hasPages())
            <div class="card-footer d-flex align-items-center">
                {!! $nodes->appends(['query' => Request::input('query')])->render() !!}
            </div>
        @endif
    </div>
@endsection

@section('admin-js')
    <script>
    (function pingNodes() {
        $('td[data-action="ping"]').each(function(i, element) {
            $.ajax({
                type: 'GET',
                url: $(element).data('location'),
                headers: {
                    'Authorization': 'Bearer ' + $(element).data('secret'),
                },
                timeout: 5000
            }).done(function (data) {
                $(element).find('.status-dot').removeClass('bg-secondary').addClass('bg-success');
                $(element).attr('title', 'v' + data.version);
            }).fail(function (error) {
                $(element).find('.status-dot').removeClass('bg-secondary status-dot-animated').addClass('bg-danger');
                var errorText = 'Error connecting to node!';
                try { errorText = error.responseJSON.errors[0].detail || errorText; } catch (ex) {}
                $(element).attr('title', errorText);
            });
        }).promise().done(function () {
            setTimeout(pingNodes, 10000);
        });
    })();
    </script>
@endsection
