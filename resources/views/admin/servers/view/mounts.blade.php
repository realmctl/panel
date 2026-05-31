@extends('layouts.admin')

@section('title')
    Server — {{ $server->name }}: Mounts
@endsection

@section('content-header')
    <h2 class="page-title">{{ $server->name }}: Mounts</h2>
@endsection

@section('admin-content')
    @include('admin.servers.partials.navigation')

    <div class="row">
        <div class="col-lg-12">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Available Mounts</h3>
                </div>
                <div class="table-responsive">
                    <table class="table table-vcenter card-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Source</th>
                                <th>Target</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach ($mounts as $mount)
                                <tr>
                                    <td><code>{{ $mount->id }}</code></td>
                                    <td><a href="{{ route('admin.mounts.view', $mount->id) }}">{{ $mount->name }}</a></td>
                                    <td><code>{{ $mount->source }}</code></td>
                                    <td><code>{{ $mount->target }}</code></td>

                                    @if (! in_array($mount->id, $server->mounts->pluck('id')->toArray()))
                                        <td>
                                            <span class="badge bg-primary">Unmounted</span>
                                        </td>

                                        <td>
                                            <form action="{{ route('admin.servers.view.mounts.store', [ 'server' => $server->id ]) }}" method="POST">
                                                {!! csrf_field() !!}
                                                <input type="hidden" value="{{ $mount->id }}" name="mount_id" />
                                                <button type="submit" class="btn btn-sm btn-success"><i class="ti ti-plus"></i></button>
                                            </form>
                                        </td>
                                    @else
                                        <td>
                                            <span class="badge bg-success">Mounted</span>
                                        </td>

                                        <td>
                                            <form action="{{ route('admin.servers.view.mounts.delete', [ 'server' => $server->id, 'mount' => $mount->id ]) }}" method="POST">
                                                @method('DELETE')
                                                {!! csrf_field() !!}

                                                <button type="submit" class="btn btn-sm btn-outline-danger"><i class="ti ti-x"></i></button>
                                            </form>
                                        </td>
                                    @endif
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
@endsection
