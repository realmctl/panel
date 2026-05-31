@extends('layouts.admin')

@section('title')
    Server — {{ $server->name }}: Startup
@endsection

@section('content-header')
    <h2 class="page-title">{{ $server->name }}: Startup</h2>
@endsection

@section('admin-content')
@include('admin.servers.partials.navigation')
<form action="{{ route('admin.servers.view.startup', $server->id) }}" method="POST">
    <div class="row row-cards">
        <div class="col-lg-12">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Startup Command Modification</h3>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <label for="pStartup" class="form-label">Startup Command</label>
                        <input id="pStartup" name="startup" class="form-control" type="text" value="{{ old('startup', $server->startup) }}" />
                        <span class="form-hint">Edit your server's startup command here. The following variables are available by default: <code>@{{SERVER_MEMORY}}</code>, <code>@{{SERVER_IP}}</code>, and <code>@{{SERVER_PORT}}</code>.</span>
                    </div>
                    <div class="mb-3">
                        <label for="pDefaultStartupCommand" class="form-label">Default Service Start Command</label>
                        <input id="pDefaultStartupCommand" class="form-control" type="text" readonly />
                    </div>
                </div>
                <div class="card-footer">
                    {!! csrf_field() !!}
                    <button type="submit" class="btn btn-primary float-end"><i class="ti ti-device-floppy me-1"></i> Save</button>
                </div>
            </div>
        </div>
    </div>
    <div class="row row-cards">
        <div class="col-lg-6">
            <div class="card mb-3">
                <div class="card-header">
                    <h3 class="card-title">Service Configuration</h3>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <div class="alert alert-warning"><i class="ti ti-alert-triangle me-2"></i> Changing any of the below values will result in the server processing a re-install command. The server will be stopped and will then proceed. If you would like the service scripts to not run, ensure the box is checked at the bottom.</div>
                        <div class="alert alert-warning"><i class="ti ti-alert-triangle me-2"></i> <strong>This is a destructive operation in many cases. This server will be stopped immediately in order for this action to proceed.</strong></div>
                    </div>
                    <div class="mb-3">
                        <label for="pNestId" class="form-label">Nest</label>
                        <select name="nest_id" id="pNestId" class="form-select">
                            @foreach($nests as $nest)
                                <option value="{{ $nest->id }}"
                                    @if($nest->id === $server->nest_id)
                                        selected
                                    @endif
                                >{{ $nest->name }}</option>
                            @endforeach
                        </select>
                        <span class="form-hint">Select the Nest that this server will be grouped into.</span>
                    </div>
                    <div class="mb-3">
                        <label for="pEggId" class="form-label">Egg</label>
                        <select name="egg_id" id="pEggId" class="form-select"></select>
                        <span class="form-hint">Select the Egg that will provide processing data for this server.</span>
                    </div>
                    <div class="mb-3">
                        <div class="form-check">
                            <input id="pSkipScripting" name="skip_scripts" type="checkbox" class="form-check-input" value="1" @if($server->skip_scripts) checked @endif />
                            <label for="pSkipScripting" class="form-check-label"><strong>Skip Egg Install Script</strong></label>
                        </div>
                        <span class="form-hint">If the selected Egg has an install script attached to it, the script will run during install. If you would like to skip this step, check this box.</span>
                    </div>
                </div>
            </div>
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Docker Image Configuration</h3>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <label for="pDockerImage" class="form-label">Image</label>
                        <select id="pDockerImage" name="docker_image" class="form-select"></select>
                        <input id="pDockerImageCustom" name="custom_docker_image" value="{{ old('custom_docker_image') }}" class="form-control mt-2" placeholder="Or enter a custom image..."/>
                        <span class="form-hint">This is the Docker image that will be used to run this server. Select an image from the dropdown or enter a custom image in the text field above.</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-lg-6">
            <div class="row row-cards" id="appendVariablesTo"></div>
        </div>
    </div>
</form>
@endsection

@section('admin-js')
    {!! Theme::js('vendor/lodash/lodash.js') !!}
    <script>
    function escapeHtml(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    $(document).ready(function () {
        $('#pEggId').select2({placeholder: 'Select a Nest Egg'}).on('change', function () {
            var selectedEgg = _.isNull($(this).val()) ? $(this).find('option').first().val() : $(this).val();
            var parentChain = _.get(Pterodactyl.nests, $("#pNestId").val());
            var objectChain = _.get(parentChain, 'eggs.' + selectedEgg);

            const images = _.get(objectChain, 'docker_images', [])
            $('#pDockerImage').html('');
            const keys = Object.keys(images);
            for (let i = 0; i < keys.length; i++) {
                let opt = document.createElement('option');
                opt.value = images[keys[i]];
                opt.innerText = keys[i] + " (" + images[keys[i]] + ")";
                if (objectChain.id === parseInt(Pterodactyl.server.egg_id) && Pterodactyl.server.image == opt.value) {
                    opt.selected = true
                }
                $('#pDockerImage').append(opt);
            }
            $('#pDockerImage').on('change', function () {
                $('#pDockerImageCustom').val('');
            })

            if (objectChain.id === parseInt(Pterodactyl.server.egg_id)) {
                if ($('#pDockerImage').val() != Pterodactyl.server.image) {
                    $('#pDockerImageCustom').val(Pterodactyl.server.image);
                }
            }

            if (!_.get(objectChain, 'startup', false)) {
                $('#pDefaultStartupCommand').val(_.get(parentChain, 'startup', 'ERROR: Startup Not Defined!'));
            } else {
                $('#pDefaultStartupCommand').val(_.get(objectChain, 'startup'));
            }

            $('#appendVariablesTo').html('');
            $.each(_.get(objectChain, 'variables', []), function (i, item) {
                var setValue = _.get(Pterodactyl.server_variables, item.env_variable, item.default_value);
                var isRequired = (item.required === 1) ? '<span class="badge bg-danger">Required</span> ' : '';
                var dataAppend = ' \
                    <div class="col-lg-12"> \
                        <div class="card"> \
                            <div class="card-header"> \
                                <h3 class="card-title">' + isRequired + escapeHtml(item.name) + '</h3> \
                            </div> \
                            <div class="card-body"> \
                                <input name="environment[' + escapeHtml(item.env_variable) + ']" class="form-control" type="text" id="egg_variable_' + escapeHtml(item.env_variable) + '" /> \
                                <span class="form-hint">' + escapeHtml(item.description) + '</span> \
                            </div> \
                            <div class="card-footer"> \
                                <span class="form-hint"><strong>Startup Command Variable:</strong> <code>' + escapeHtml(item.env_variable) + '</code></span> \
                                <span class="form-hint"><strong>Input Rules:</strong> <code>' + escapeHtml(item.rules) + '</code></span> \
                            </div> \
                        </div> \
                    </div>';
                $('#appendVariablesTo').append(dataAppend).find('#egg_variable_' + item.env_variable).val(setValue);
            });
        });

        $('#pNestId').select2({placeholder: 'Select a Nest'}).on('change', function () {
            $('#pEggId').html('').select2({
                data: $.map(_.get(Pterodactyl.nests, $(this).val() + '.eggs', []), function (item) {
                    return {
                        id: item.id,
                        text: item.name,
                    };
                }),
            });

            if (_.isObject(_.get(Pterodactyl.nests, $(this).val() + '.eggs.' + Pterodactyl.server.egg_id))) {
                $('#pEggId').val(Pterodactyl.server.egg_id);
            }

            $('#pEggId').change();
        }).change();
    });
    </script>
@endsection
