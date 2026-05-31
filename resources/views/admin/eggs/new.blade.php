@extends('layouts.admin')

@section('title')
    Nests &rarr; New Egg
@endsection

@section('content-header')
    <h2 class="page-title">New Egg</h2>
@endsection

@section('admin-content')
<div class="row">
    <div class="col-lg-12">
        <form action="{{ route('admin.nests.egg.new') }}" method="POST">
            <div class="card mb-3">
                <div class="card-header">
                    <h3 class="card-title">Configuration</h3>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-lg-6">
                            <div class="mb-3">
                                <label for="pNestId" class="form-label">Associated Nest</label>
                                <select name="nest_id" id="pNestId" class="form-select">
                                    @foreach($nests as $nest)
                                        <option value="{{ $nest->id }}" {{ old('nest_id') != $nest->id ?: 'selected' }}>{{ $nest->name }} &lt;{{ $nest->author }}&gt;</option>
                                    @endforeach
                                </select>
                                <span class="form-hint">Think of a Nest as a category. You can put multiple Eggs in a nest, but consider putting only Eggs that are related to each other in each Nest.</span>
                            </div>
                            <div class="mb-3">
                                <label for="pName" class="form-label">Name</label>
                                <input type="text" id="pName" name="name" value="{{ old('name') }}" class="form-control" />
                                <span class="form-hint">A simple, human-readable name to use as an identifier for this Egg. This is what users will see as their game server type.</span>
                            </div>
                            <div class="mb-3">
                                <label for="pDescription" class="form-label">Description</label>
                                <textarea id="pDescription" name="description" class="form-control" rows="8">{{ old('description') }}</textarea>
                                <span class="form-hint">A description of this Egg.</span>
                            </div>
                            <div class="mb-3">
                                <div class="form-check">
                                    <input id="pForceOutgoingIp" name="force_outgoing_ip" type="checkbox" class="form-check-input" value="1" {{ \Pterodactyl\Helpers\Utilities::checked('force_outgoing_ip', 0) }} />
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
                                <label for="pDockerImage" class="form-label">Docker Images</label>
                                <textarea id="pDockerImages" name="docker_images" rows="4" placeholder="ghcr.io/pterodactyl/yolks" class="form-control">{{ old('docker_images') }}</textarea>
                                <span class="form-hint">The docker images available to servers using this egg. Enter one per line. Users will be able to select from this list of images if more than one value is provided.</span>
                            </div>
                            <div class="mb-3">
                                <label for="pStartup" class="form-label">Startup Command</label>
                                <textarea id="pStartup" name="startup" class="form-control" rows="10">{{ old('startup') }}</textarea>
                                <span class="form-hint">The default startup command that should be used for new servers created with this Egg. You can change this per-server as needed.</span>
                            </div>
                            <div class="mb-3">
                                <label for="pConfigFeatures" class="form-label">Features</label>
                                <select class="form-select" name="features[]" id="pConfigFeatures" multiple>
                                </select>
                                <span class="form-hint">Additional features belonging to the egg. Useful for configuring additional panel modifications.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
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
                                    <div>All fields are required unless you select a separate option from the 'Copy Settings From' dropdown, in which case fields may be left blank to use the values from that option.</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-6">
                            <div class="mb-3">
                                <label for="pConfigFrom" class="form-label">Copy Settings From</label>
                                <select name="config_from" id="pConfigFrom" class="form-select">
                                    <option value="">None</option>
                                </select>
                                <span class="form-hint">If you would like to default to settings from another Egg select it from the dropdown above.</span>
                            </div>
                            <div class="mb-3">
                                <label for="pConfigStop" class="form-label">Stop Command</label>
                                <input type="text" id="pConfigStop" name="config_stop" class="form-control" value="{{ old('config_stop') }}" />
                                <span class="form-hint">The command that should be sent to server processes to stop them gracefully. If you need to send a <code>SIGINT</code> you should enter <code>^C</code> here.</span>
                            </div>
                            <div class="mb-3">
                                <label for="pConfigLogs" class="form-label">Log Configuration</label>
                                <textarea data-action="handle-tabs" id="pConfigLogs" name="config_logs" class="form-control" rows="6">{{ old('config_logs') }}</textarea>
                                <span class="form-hint">This should be a JSON representation of where log files are stored, and whether or not the daemon should be creating custom logs.</span>
                            </div>
                        </div>
                        <div class="col-lg-6">
                            <div class="mb-3">
                                <label for="pConfigFiles" class="form-label">Configuration Files</label>
                                <textarea data-action="handle-tabs" id="pConfigFiles" name="config_files" class="form-control" rows="6">{{ old('config_files') }}</textarea>
                                <span class="form-hint">This should be a JSON representation of configuration files to modify and what parts should be changed.</span>
                            </div>
                            <div class="mb-3">
                                <label for="pConfigStartup" class="form-label">Start Configuration</label>
                                <textarea data-action="handle-tabs" id="pConfigStartup" name="config_startup" class="form-control" rows="6">{{ old('config_startup') }}</textarea>
                                <span class="form-hint">This should be a JSON representation of what values the daemon should be looking for when booting a server to determine completion.</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-footer text-end">
                    {!! csrf_field() !!}
                    <button type="submit" class="btn btn-primary"><i class="ti ti-device-floppy me-1"></i> Create</button>
                </div>
            </div>
        </form>
    </div>
</div>
@endsection

@section('admin-js')
    {!! Theme::js('vendor/lodash/lodash.js') !!}
    <script>
    $(document).ready(function() {
        $('#pNestId').select2().change();
        $('#pConfigFrom').select2();
    });
    $('#pNestId').on('change', function (event) {
        $('#pConfigFrom').html('<option value="">None</option>').select2({
            data: $.map(_.get(Pterodactyl.nests, $(this).val() + '.eggs', []), function (item) {
                return {
                    id: item.id,
                    text: item.name + ' <' + item.author + '>',
                };
            }),
        });
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
