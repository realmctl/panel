@extends('layouts.admin')

@section('title')
    Nests
@endsection

@section('content-header')
    <h2 class="page-title">Nests</h2>
@endsection

@section('admin-content')
<div class="row">
    <div class="col-lg-12">
        <div class="alert alert-warning">
            <div class="d-flex">
                <div><i class="ti ti-alert-triangle me-2"></i></div>
                <div>Eggs are a powerful feature of Pterodactyl Panel that allow for extreme flexibility and configuration. Please note that while powerful, modifying an egg wrongly can very easily brick your servers and cause more problems. Please avoid editing our default eggs — those provided by <code>support@realmctl.com</code> — unless you are absolutely sure of what you are doing.</div>
            </div>
        </div>
    </div>
</div>
<div class="row">
    <div class="col-lg-12">
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Configured Nests</h3>
                <div class="card-actions">
                    <a href="#" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#importServiceOptionModal" role="button"><i class="ti ti-upload me-1"></i> Import Egg</a>
                    <a href="{{ route('admin.nests.new') }}" class="btn btn-primary"><i class="ti ti-plus me-1"></i> Create New</a>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-vcenter card-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Description</th>
                            <th class="text-center">Eggs</th>
                            <th class="text-center">Servers</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($nests as $nest)
                            <tr>
                                <td><code>{{ $nest->id }}</code></td>
                                <td><a href="{{ route('admin.nests.view', $nest->id) }}" data-bs-toggle="tooltip" data-bs-placement="right" title="{{ $nest->author }}">{{ $nest->name }}</a></td>
                                <td class="col-lg-6">{{ $nest->description }}</td>
                                <td class="text-center">{{ $nest->eggs_count }}</td>
                                <td class="text-center">{{ $nest->servers_count }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
<div class="modal fade" tabindex="-1" role="dialog" id="importServiceOptionModal">
    <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">Import an Egg</h4>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form action="{{ route('admin.nests.egg.import') }}" enctype="multipart/form-data" method="POST">
                <div class="modal-body">
                    <div class="mb-3">
                        <label class="form-label" for="pImportFile">Egg File <span class="field-required"></span></label>
                        <div>
                            <input id="pImportFile" type="file" name="import_file" class="form-control" accept="application/json" />
                            <span class="form-hint">Select the <code>.json</code> file for the new egg that you wish to import.</span>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label" for="pImportToNest">Associated Nest <span class="field-required"></span></label>
                        <div>
                            <select id="pImportToNest" name="import_to_nest" class="form-select">
                                @foreach($nests as $nest)
                                   <option value="{{ $nest->id }}">{{ $nest->name }} &lt;{{ $nest->author }}&gt;</option>
                                @endforeach
                            </select>
                            <span class="form-hint">Select the nest that this egg will be associated with from the dropdown. If you wish to associate it with a new nest you will need to create that nest before continuing.</span>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    {{ csrf_field() }}
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary"><i class="ti ti-upload me-1"></i> Import</button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection

@section('admin-js')
    <script>
        $(document).ready(function() {
            $('#pImportToNest').select2({
                dropdownParent: $('#importServiceOptionModal'),
                width: '100%'
            });
        });
    </script>
@endsection
