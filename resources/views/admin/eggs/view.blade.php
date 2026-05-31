@extends('layouts.admin')

@section('title')
    Nests &rarr; Egg: {{ $egg->name }}
@endsection

@section('content-header')
    <h2 class="page-title">{{ $egg->name }}</h2>
@endsection

@section('admin-content')
<ul class="nav nav-tabs mb-3">
    <li class="nav-item"><a class="nav-link active" href="{{ route('admin.nests.egg.view', $egg->id) }}"><i class="ti ti-settings me-1"></i> Configuration</a></li>
    <li class="nav-item"><a class="nav-link" href="{{ route('admin.nests.egg.variables', $egg->id) }}"><i class="ti ti-variable me-1"></i> Variables</a></li>
    <li class="nav-item"><a class="nav-link" href="{{ route('admin.nests.egg.scripts', $egg->id) }}"><i class="ti ti-script me-1"></i> Install Script</a></li>
</ul>
<form action="{{ route('admin.nests.egg.view', $egg->id) }}" enctype="multipart/form-data" method="POST">
    <div class="row">
        <div class="col-lg-12">
            <div class="card mb-3 border-danger">
                <div class="card-body">
                    <div class="row">
                        <div class="col-lg-8">
                            <div class="mb-3">
                                <label for="pName" class="form-label">Egg File</label>
                                <input type="file" name="import_file" class="form-control" />
                                <span class="form-hint">If you would like to replace settings for this Egg by uploading a new JSON file, simply select it here and press "Update Egg". This will not change any existing startup strings or Docker images for existing servers.</span>
                            </div>
                        </div>
                        <div class="col-lg-4 d-flex align-items-center justify-content-end">
                            {!! csrf_field() !!}
                            <button type="submit" name="_method" value="PUT" class="btn btn-outline-danger"><i class="ti ti-refresh me-1"></i> Update Egg</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</form>
<form action="{{ route('admin.nests.egg.view', $egg->id) }}" method="POST">
    <div class="row">
        <div class="col-lg-12">
            <div class="card mb-3">
                <div class="card-header">
                    <h3 class="card-title">Configuration</h3>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-lg-6">
                            <div class="mb-3">
                                <label for="pName" class="form-label">Name <span class="field-required"></span></label>
                                <input type="text" id="pName" name="name" value="{{ $egg->name }}" class="form-control" />
                                <span class="form-hint">A simple, human-readable name to use as an identifier for this Egg.</span>
                            </div>
                            <div class="mb-3">
                                <label for="pUuid" class="form-label">UUID</label>
                                <input type="text" id="pUuid" readonly value="{{ $egg->uuid }}" class="form-control" />
                                <span class="form-hint">This is the globally unique identifier for this Egg which the Daemon uses as an identifier.</span>
                            </div>
                            <div class="mb-3">
                                <label for="pAuthor" class="form-label">Author</label>
                                <input type="text" id="pAuthor" readonly value="{{ $egg->author }}" class="form-control" />
                                <span class="form-hint">The author of this version of the Egg. Uploading a new Egg configuration from a different author will change this.</span>
                            </div>
                            <div class="mb-3">
                                <label for="pDockerImage" class="form-label">Docker Images <span class="field-required"></span></label>
                                <textarea id="pDockerImages" name="docker_images" class="form-control" rows="4">{{ implode(PHP_EOL, $images) }}</textarea>
                                <span class="form-hint">
                                    The docker images available to servers using this egg. Enter one per line. Users
                                    will be able to select from this list of images if more than one value is provided.
                                    Optionally, a display name may be provided by prefixing the image with the name
                                    followed by a pipe character, and then the image URL. Example: <code>Display Name|ghcr.io/my/egg</code>
                                </span>
                            </div>
                            <div class="mb-3">
                                <div class="form-check">
                                    <input id="pForceOutgoingIp" name="force_outgoing_ip" type="checkbox" class="form-check-input" value="1" @if($egg->force_outgoing_ip) checked @endif />
                                    <label for="pForceOutgoingIp" class="form-check-label fw-bold">Force Outgoing IP</label>
                                </div>
                                <span class="form-hint">
                                    Forces all outgoing network traffic to have its Source IP NATed to the IP of the server's primary allocation IP.
                                    Required for certain games to work properly when the Node has multiple public IP addresses.
                                    <br>
                                    <strong>
                                        Enabling this option will disable internal networking for any servers using this egg,
                                        causing them to be unable to internally access other servers on the same node.
                                    </strong>
                                </span>
                            </div>
                        </div>
                        <div class="col-lg-6">
                            <div class="mb-3">
                                <label for="pDescription" class="form-label">Description</label>
                                <textarea id="pDescription" name="description" class="form-control" rows="8">{{ $egg->description }}</textarea>
                                <span class="form-hint">A description of this Egg that will be displayed throughout the Panel as needed.</span>
                            </div>
                            <div class="mb-3">
                                <label for="pBackground" class="form-label">Card Background</label>
                                <select id="pBackground" name="background" class="form-select">
                                    <option value="">Auto-detect (based on egg name)</option>
                                    <option value="minecraft.png" {{ $egg->background === 'minecraft.png' ? 'selected' : '' }}>Minecraft</option>
                                    <option value="rust.jpg" {{ $egg->background === 'rust.jpg' ? 'selected' : '' }}>Rust</option>
                                    <option value="valheim.jpeg" {{ $egg->background === 'valheim.jpeg' ? 'selected' : '' }}>Valheim</option>
                                    <option value="ark.webp" {{ $egg->background === 'ark.webp' ? 'selected' : '' }}>ARK</option>
                                    <option value="terraria.jpg" {{ $egg->background === 'terraria.jpg' ? 'selected' : '' }}>Terraria</option>
                                    <option value="csgo.jpg" {{ $egg->background === 'csgo.jpg' ? 'selected' : '' }}>CS2 / CS:GO</option>
                                    <option value="gmod.jpeg" {{ $egg->background === 'gmod.jpeg' ? 'selected' : '' }}>Garry's Mod</option>
                                    <option value="fivem.jpeg" {{ $egg->background === 'fivem.jpeg' ? 'selected' : '' }}>FiveM</option>
                                </select>
                                <span class="form-hint">The background image shown on server cards in the client panel. Leave as auto-detect to determine based on the egg name.</span>
                            </div>
                            <div class="mb-3">
                                <label for="pStartup" class="form-label">Startup Command <span class="field-required"></span></label>
                                <textarea id="pStartup" name="startup" class="form-control" rows="8">{{ $egg->startup }}</textarea>
                                <span class="form-hint">The default startup command that should be used for new servers using this Egg.</span>
                            </div>
                            <div class="mb-3">
                                <label for="pConfigFeatures" class="form-label">Features</label>
                                <select class="form-select" name="features[]" id="pConfigFeatures" multiple>
                                    @foreach(($egg->features ?? []) as $feature)
                                        <option value="{{ $feature }}" selected>{{ $feature }}</option>
                                    @endforeach
                                </select>
                                <span class="form-hint">Additional features belonging to the egg. Useful for configuring additional panel modifications.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-lg-12">
            <div class="card mb-3">
                <div class="card-header">
                    <h3 class="card-title">Process Management</h3>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-lg-12">
                            <div class="alert alert-warning">
                                <div class="d-flex">
                                    <div><i class="ti ti-alert-triangle me-2"></i></div>
                                    <div>
                                        <p class="mb-1">The following configuration options should not be edited unless you understand how this system works. If wrongly modified it is possible for the daemon to break.</p>
                                        <p class="mb-0">All fields are required unless you select a separate option from the 'Copy Settings From' dropdown, in which case fields may be left blank to use the values from that Egg.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-6">
                            <div class="mb-3">
                                <label for="pConfigFrom" class="form-label">Copy Settings From</label>
                                <select name="config_from" id="pConfigFrom" class="form-select">
                                    <option value="">None</option>
                                    @foreach($egg->nest->eggs as $o)
                                        <option value="{{ $o->id }}" {{ ($egg->config_from !== $o->id) ?: 'selected' }}>{{ $o->name }} &lt;{{ $o->author }}&gt;</option>
                                    @endforeach
                                </select>
                                <span class="form-hint">If you would like to default to settings from another Egg select it from the menu above.</span>
                            </div>
                            <div class="mb-3">
                                <label for="pConfigStop" class="form-label">Stop Command</label>
                                <input type="text" id="pConfigStop" name="config_stop" class="form-control" value="{{ $egg->config_stop }}" />
                                <span class="form-hint">The command that should be sent to server processes to stop them gracefully. If you need to send a <code>SIGINT</code> you should enter <code>^C</code> here.</span>
                            </div>
                            <div class="mb-3">
                                <label for="pConfigLogs" class="form-label">Log Configuration</label>
                                <textarea data-action="handle-tabs" id="pConfigLogs" name="config_logs" class="form-control" rows="6">{{ ! is_null($egg->config_logs) ? json_encode(json_decode($egg->config_logs), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) : '' }}</textarea>
                                <span class="form-hint">This should be a JSON representation of where log files are stored, and whether or not the daemon should be creating custom logs.</span>
                            </div>
                        </div>
                        <div class="col-lg-6">
                            <div class="mb-3">
                                <label for="pConfigFiles" class="form-label">Configuration Files</label>
                                <textarea data-action="handle-tabs" id="pConfigFiles" name="config_files" class="form-control" rows="6">{{ ! is_null($egg->config_files) ? json_encode(json_decode($egg->config_files), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) : '' }}</textarea>
                                <span class="form-hint">This should be a JSON representation of configuration files to modify and what parts should be changed.</span>
                            </div>
                            <div class="mb-3">
                                <label for="pConfigStartup" class="form-label">Start Configuration</label>
                                <textarea data-action="handle-tabs" id="pConfigStartup" name="config_startup" class="form-control" rows="6">{{ ! is_null($egg->config_startup) ? json_encode(json_decode($egg->config_startup), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) : '' }}</textarea>
                                <span class="form-hint">This should be a JSON representation of what values the daemon should be looking for when booting a server to determine completion.</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-footer d-flex justify-content-between">
                    <div>
                        <button id="deleteButton" type="submit" name="_method" value="DELETE" class="btn btn-outline-danger"><i class="ti ti-trash me-1"></i> Delete</button>
                    </div>
                    <div>
                        {!! csrf_field() !!}
                        <a href="{{ route('admin.nests.egg.export', $egg->id) }}" class="btn btn-info me-2"><i class="ti ti-download me-1"></i> Export</a>
                        <button type="submit" name="_method" value="PATCH" class="btn btn-primary"><i class="ti ti-device-floppy me-1"></i> Save</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</form>
@endsection

@section('admin-js')
    <script>
    $('#pConfigFrom').select2();
    $('#deleteButton').on('mouseenter', function (event) {
        $(this).find('i').html(' Delete Egg');
    }).on('mouseleave', function (event) {
        $(this).find('i').html('');
    });
    $('textarea[data-action="handle-tabs"]').on('keydown', function(event) {
        if (event.keyCode === 9) {
            event.preventDefault();

            var curPos = $(this)[0].selectionStart;
            var prepend = $(this).val().substr(0, curPos);
            var append = $(this).val().substr(curPos);

            $(this).val(prepend + '    ' + append);
        }
    });
    $('#pConfigFeatures').select2({
        tags: true,
        selectOnClose: false,
        tokenSeparators: [',', ' '],
    });
    </script>
@endsection
