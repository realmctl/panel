
@extends('layouts.admin')

@section('title')
    Mounts
@endsection

@section('content-header')
    <h2 class="page-title">Mounts</h2>
@endsection

@section('admin-content')
    <div class="row">
        <div class="col-lg-12">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Mount List</h3>

                    <div class="card-actions">
                        <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#newMountModal"><i class="ti ti-plus me-1"></i> Create New</button>
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="table table-vcenter card-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Source</th>
                                <th>Target</th>
                                <th class="text-center">Eggs</th>
                                <th class="text-center">Nodes</th>
                                <th class="text-center">Servers</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach ($mounts as $mount)
                                <tr>
                                    <td><code>{{ $mount->id }}</code></td>
                                    <td><a href="{{ route('admin.mounts.view', $mount->id) }}">{{ $mount->name }}</a></td>
                                    <td><code>{{ $mount->source }}</code></td>
                                    <td><code>{{ $mount->target }}</code></td>
                                    <td class="text-center">{{ $mount->eggs_count }}</td>
                                    <td class="text-center">{{ $mount->nodes_count }}</td>
                                    <td class="text-center">{{ $mount->servers_count }}</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="newMountModal" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <form action="{{ route('admin.mounts') }}" method="POST">
                    <div class="modal-header">
                        <h4 class="modal-title">Create Mount</h4>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>

                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-12 mb-3">
                                <label for="pName" class="form-label">Name</label>
                                <input type="text" id="pName" name="name" class="form-control" />
                                <span class="form-hint">Unique name used to separate this mount from another.</span>
                            </div>

                            <div class="col-md-12 mb-3">
                                <label for="pDescription" class="form-label">Description</label>
                                <textarea id="pDescription" name="description" class="form-control" rows="4"></textarea>
                                <span class="form-hint">A longer description for this mount, must be less than 191 characters.</span>
                            </div>

                            <div class="col-md-6 mb-3">
                                <label for="pSource" class="form-label">Source</label>
                                <input type="text" id="pSource" name="source" class="form-control" />
                                <span class="form-hint">File path on the host system to mount to a container.</span>
                            </div>

                            <div class="col-md-6 mb-3">
                                <label for="pTarget" class="form-label">Target</label>
                                <input type="text" id="pTarget" name="target" class="form-control" />
                                <span class="form-hint">Where the mount will be accessible inside a container.</span>
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label">Read Only</label>

                                <div>
                                    <div class="form-check form-check-inline">
                                        <input class="form-check-input" type="radio" id="pReadOnlyFalse" name="read_only" value="0" checked>
                                        <label class="form-check-label" for="pReadOnlyFalse">False</label>
                                    </div>

                                    <div class="form-check form-check-inline">
                                        <input class="form-check-input" type="radio" id="pReadOnly" name="read_only" value="1">
                                        <label class="form-check-label" for="pReadOnly">True</label>
                                    </div>
                                </div>

                                <span class="form-hint">Is the mount read only inside the container?</span>
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label">User Mountable</label>

                                <div>
                                    <div class="form-check form-check-inline">
                                        <input class="form-check-input" type="radio" id="pUserMountableFalse" name="user_mountable" value="0" checked>
                                        <label class="form-check-label" for="pUserMountableFalse">False</label>
                                    </div>

                                    <div class="form-check form-check-inline">
                                        <input class="form-check-input" type="radio" id="pUserMountable" name="user_mountable" value="1">
                                        <label class="form-check-label" for="pUserMountable">True</label>
                                    </div>
                                </div>

                                <span class="form-hint">Should users be able to mount this themselves?</span>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        {!! csrf_field() !!}
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="submit" class="btn btn-primary"><i class="ti ti-device-floppy me-1"></i> Create</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
@endsection
