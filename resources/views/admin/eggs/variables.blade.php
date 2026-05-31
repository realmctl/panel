@extends('layouts.admin')

@section('title')
    Egg &rarr; {{ $egg->name }} &rarr; Variables
@endsection

@section('content-header')
    <h2 class="page-title">{{ $egg->name }}</h2>
@endsection

@section('admin-content')
<ul class="nav nav-tabs mb-3">
    <li class="nav-item"><a class="nav-link" href="{{ route('admin.nests.egg.view', $egg->id) }}"><i class="ti ti-settings me-1"></i> Configuration</a></li>
    <li class="nav-item"><a class="nav-link active" href="{{ route('admin.nests.egg.variables', $egg->id) }}"><i class="ti ti-variable me-1"></i> Variables</a></li>
    <li class="nav-item"><a class="nav-link" href="{{ route('admin.nests.egg.scripts', $egg->id) }}"><i class="ti ti-script me-1"></i> Install Script</a></li>
</ul>
<div class="row mb-3">
    <div class="col-lg-12 text-end">
        <a href="#" class="btn btn-primary" data-toggle="modal" data-target="#newVariableModal"><i class="ti ti-plus me-1"></i> Create New Variable</a>
    </div>
</div>
<div class="row">
    @foreach($egg->variables as $variable)
        <div class="col-lg-6">
            <div class="card mb-3">
                <div class="card-header">
                    <h3 class="card-title">{{ $variable->name }}</h3>
                </div>
                <form action="{{ route('admin.nests.egg.variables.edit', ['egg' => $egg->id, 'variable' => $variable->id]) }}" method="POST">
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="form-label">Name</label>
                            <input type="text" name="name" value="{{ $variable->name }}" class="form-control" />
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Description</label>
                            <textarea name="description" class="form-control" rows="3">{{ $variable->description }}</textarea>
                        </div>
                        <div class="row">
                            <div class="col-lg-6 mb-3">
                                <label class="form-label">Environment Variable</label>
                                <input type="text" name="env_variable" value="{{ $variable->env_variable }}" class="form-control" />
                            </div>
                            <div class="col-lg-6 mb-3">
                                <label class="form-label">Default Value</label>
                                <input type="text" name="default_value" value="{{ $variable->default_value }}" class="form-control" />
                            </div>
                            <div class="col-lg-12">
                                <span class="form-hint">This variable can be accessed in the startup command by using <code>{{ $variable->env_variable }}</code>.</span>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Permissions</label>
                            <select name="options[]" class="pOptions form-select" multiple>
                                <option value="user_viewable" {{ (! $variable->user_viewable) ?: 'selected' }}>Users Can View</option>
                                <option value="user_editable" {{ (! $variable->user_editable) ?: 'selected' }}>Users Can Edit</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Input Rules</label>
                            <input type="text" name="rules" class="form-control" value="{{ $variable->rules }}" />
                            <span class="form-hint">These rules are defined using standard <a href="https://laravel.com/docs/5.7/validation#available-validation-rules" target="_blank">Laravel Framework validation rules</a>.</span>
                        </div>
                    </div>
                    <div class="card-footer d-flex justify-content-between">
                        <button class="btn btn-outline-danger" data-action="delete" name="_method" value="DELETE" type="submit"><i class="ti ti-trash me-1"></i> Delete</button>
                        {!! csrf_field() !!}
                        <button class="btn btn-primary" name="_method" value="PATCH" type="submit"><i class="ti ti-device-floppy me-1"></i> Save</button>
                    </div>
                </form>
            </div>
        </div>
    @endforeach
</div>
<div class="modal fade" id="newVariableModal" tabindex="-1" role="dialog">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">Create New Egg Variable</h4>
                <button type="button" class="btn-close" data-dismiss="modal" aria-label="Close"></button>
            </div>
            <form action="{{ route('admin.nests.egg.variables', $egg->id) }}" method="POST">
                <div class="modal-body">
                    <div class="mb-3">
                        <label class="form-label">Name <span class="field-required"></span></label>
                        <input type="text" name="name" class="form-control" value="{{ old('name') }}"/>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Description</label>
                        <textarea name="description" class="form-control" rows="3">{{ old('description') }}</textarea>
                    </div>
                    <div class="row">
                        <div class="col-lg-6 mb-3">
                            <label class="form-label">Environment Variable <span class="field-required"></span></label>
                            <input type="text" name="env_variable" class="form-control" value="{{ old('env_variable') }}" />
                        </div>
                        <div class="col-lg-6 mb-3">
                            <label class="form-label">Default Value</label>
                            <input type="text" name="default_value" class="form-control" value="{{ old('default_value') }}" />
                        </div>
                        <div class="col-lg-12">
                            <span class="form-hint">This variable can be accessed in the startup command by entering <code>@{{environment variable value}}</code>.</span>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Permissions</label>
                        <select name="options[]" class="pOptions form-select" multiple>
                            <option value="user_viewable">Users Can View</option>
                            <option value="user_editable">Users Can Edit</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Input Rules <span class="field-required"></span></label>
                        <input type="text" name="rules" class="form-control" value="{{ old('rules', 'required|string|max:20') }}" placeholder="required|string|max:20" />
                        <span class="form-hint">These rules are defined using standard <a href="https://laravel.com/docs/5.7/validation#available-validation-rules" target="_blank">Laravel Framework validation rules</a>.</span>
                    </div>
                </div>
                <div class="modal-footer">
                    {!! csrf_field() !!}
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                    <button type="submit" class="btn btn-primary"><i class="ti ti-plus me-1"></i> Create Variable</button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection

@section('admin-js')
    <script>
        $('.pOptions').select2();
        $('[data-action="delete"]').on('mouseenter', function (event) {
            $(this).find('i').html(' Delete Variable');
        }).on('mouseleave', function (event) {
            $(this).find('i').html('');
        });
    </script>
@endsection
