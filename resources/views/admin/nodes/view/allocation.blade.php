@extends('layouts.admin')

@section('title')
    {{ $node->name }}: Allocations
@endsection

@section('content-header')
    <h2 class="page-title">{{ $node->name }} — Allocations</h2>
@endsection

@section('admin-content')
<div class="row mb-3">
    <div class="col-lg-12">
        <ul class="nav nav-tabs">
            <li class="nav-item">
                <a class="nav-link" href="{{ route('admin.nodes.view', $node->id) }}">About</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="{{ route('admin.nodes.view.settings', $node->id) }}">Settings</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="{{ route('admin.nodes.view.configuration', $node->id) }}">Configuration</a>
            </li>
            <li class="nav-item">
                <a class="nav-link active" href="{{ route('admin.nodes.view.allocation', $node->id) }}">Allocation</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="{{ route('admin.nodes.view.servers', $node->id) }}">Servers</a>
            </li>
        </ul>
    </div>
</div>
<div class="row">
    <div class="col-lg-8">
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Existing Allocations</h3>
            </div>
            <div class="table-responsive">
                <table class="table table-vcenter card-table">
                    <thead>
                        <tr>
                            <th>
                                <input type="checkbox" class="form-check-input select-all-files" data-action="selectAll">
                            </th>
                            <th>IP Address <i class="ti ti-square-minus text-danger" style="cursor:pointer;" data-bs-toggle="modal" data-bs-target="#allocationModal"></i></th>
                            <th>IP Alias</th>
                            <th>Port</th>
                            <th>Assigned To</th>
                            <th>
                                <div class="btn-group">
                                    <button type="button" id="mass_actions" class="btn btn-sm btn-outline-secondary dropdown-toggle disabled"
                                            data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Mass Actions</button>
                                    <ul class="dropdown-menu">
                                        <li><a class="dropdown-item" href="#" id="selective-deletion" data-action="selective-deletion"><i class="ti ti-trash me-1"></i> Delete</a></li>
                                    </ul>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($node->allocations as $allocation)
                            <tr>
                                <td class="min-size" data-identifier="type">
                                    @if(is_null($allocation->server_id))
                                    <input type="checkbox" class="form-check-input select-file" data-action="addSelection">
                                    @else
                                    <input disabled="disabled" type="checkbox" class="form-check-input select-file" data-action="addSelection">
                                    @endif
                                </td>
                                <td data-identifier="ip">{{ $allocation->ip }}</td>
                                <td>
                                    <input class="form-control form-control-sm" type="text" value="{{ $allocation->ip_alias }}" data-action="set-alias" data-id="{{ $allocation->id }}" placeholder="none" />
                                    <span class="input-loader"><i class="ti ti-refresh"></i></span>
                                </td>
                                <td data-identifier="port">{{ $allocation->port }}</td>
                                <td>
                                    @if(! is_null($allocation->server))
                                        <a href="{{ route('admin.servers.view', $allocation->server_id) }}">{{ $allocation->server->name }}</a>
                                    @endif
                                </td>
                                <td>
                                    @if(is_null($allocation->server_id))
                                        <button data-action="deallocate" data-id="{{ $allocation->id }}" class="btn btn-sm btn-outline-danger"><i class="ti ti-trash"></i></button>
                                    @endif
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
            @if($node->allocations->hasPages())
                <div class="card-footer text-center">
                    {{ $node->allocations->render() }}
                </div>
            @endif
        </div>
    </div>
    <div class="col-lg-4">
        <form action="{{ route('admin.nodes.view.allocation', $node->id) }}" method="POST">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Assign New Allocations</h3>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <label for="pAllocationIP" class="form-label">IP Address</label>
                        <select class="form-select" name="allocation_ip" id="pAllocationIP" multiple>
                            @foreach($allocations as $allocation)
                                <option value="{{ $allocation->ip }}">{{ $allocation->ip }}</option>
                            @endforeach
                        </select>
                        <small class="form-hint">Enter an IP address to assign ports to here.</small>
                    </div>
                    <div class="mb-3">
                        <label for="pAllocationAlias" class="form-label">IP Alias</label>
                        <input type="text" id="pAllocationAlias" class="form-control" name="allocation_alias" placeholder="alias" />
                        <small class="form-hint">If you would like to assign a default alias to these allocations enter it here.</small>
                    </div>
                    <div class="mb-3">
                        <label for="pAllocationPorts" class="form-label">Ports</label>
                        <select class="form-select" name="allocation_ports[]" id="pAllocationPorts" multiple></select>
                        <small class="form-hint">Enter individual ports or port ranges here separated by commas or spaces.</small>
                    </div>
                </div>
                <div class="card-footer text-end">
                    {!! csrf_field() !!}
                    <button type="submit" class="btn btn-primary">
                        <i class="ti ti-device-floppy me-1"></i> Submit
                    </button>
                </div>
            </div>
        </form>
    </div>
</div>

{{-- Delete Allocations Modal --}}
<div class="modal modal-blur fade" id="allocationModal" tabindex="-1" role="dialog">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Delete Allocations for IP Block</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form action="{{ route('admin.nodes.view.allocation.removeBlock', $node->id) }}" method="POST">
                <div class="modal-body">
                    <div class="mb-3">
                        <select class="form-select" name="ip">
                            @foreach($allocations as $allocation)
                                <option value="{{ $allocation->ip }}">{{ $allocation->ip }}</option>
                            @endforeach
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    {{{ csrf_field() }}}
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="submit" class="btn btn-outline-danger">
                        <i class="ti ti-trash me-1"></i> Delete Allocations
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection

@section('admin-js')
    <script>
    $('[data-action="addSelection"]').on('click', function () {
        updateMassActions();
    });

    $('[data-action="selectAll"]').on('click', function () {
        $('input.select-file').not(':disabled').prop('checked', function (i, val) {
            return !val;
        });

        updateMassActions();
    });

    $('[data-action="selective-deletion"]').on('mousedown', function () {
        deleteSelected();
    });

    $('#pAllocationIP').select2({
        tags: true,
        maximumSelectionLength: 1,
        selectOnClose: true,
        tokenSeparators: [',', ' '],
    });

    $('#pAllocationPorts').select2({
        tags: true,
        selectOnClose: true,
        tokenSeparators: [',', ' '],
    });

    $('button[data-action="deallocate"]').click(function (event) {
        event.preventDefault();
        var element = $(this);
        var allocation = $(this).data('id');
        swal({
            title: '',
            text: 'Are you sure you want to delete this allocation?',
            type: 'warning',
            showCancelButton: true,
            allowOutsideClick: true,
            closeOnConfirm: false,
            confirmButtonText: 'Delete',
            confirmButtonColor: '#d9534f',
            showLoaderOnConfirm: true
        }, function () {
            $.ajax({
                method: 'DELETE',
                url: '/admin/nodes/view/' + {{ $node->id }} + '/allocation/remove/' + allocation,
                headers: { 'X-CSRF-TOKEN': $('meta[name="_token"]').attr('content') },
            }).done(function (data) {
                element.parent().parent().addClass('warning').delay(100).fadeOut();
                swal({ type: 'success', title: 'Port Deleted!' });
            }).fail(function (jqXHR) {
                console.error(jqXHR);
                swal({
                    title: 'Whoops!',
                    text: jqXHR.responseJSON.error,
                    type: 'error'
                });
            });
        });
    });

    var typingTimer;
    $('input[data-action="set-alias"]').keyup(function () {
        clearTimeout(typingTimer);
        $(this).parent().removeClass('has-error has-success');
        typingTimer = setTimeout(sendAlias, 250, $(this));
    });

    var fadeTimers = [];
    function sendAlias(element) {
        element.parent().find('.input-loader').show();
        clearTimeout(fadeTimers[element.data('id')]);
        $.ajax({
            method: 'POST',
            url: '/admin/nodes/view/' + {{ $node->id }} + '/allocation/alias',
            headers: { 'X-CSRF-TOKEN': $('meta[name="_token"]').attr('content') },
            data: {
                alias: element.val(),
                allocation_id: element.data('id'),
            }
        }).done(function () {
            element.parent().addClass('has-success');
        }).fail(function (jqXHR) {
            console.error(jqXHR);
            element.parent().addClass('has-error');
        }).always(function () {
            element.parent().find('.input-loader').hide();
            fadeTimers[element.data('id')] = setTimeout(clearHighlight, 2500, element);
        });
    }

    function clearHighlight(element) {
        element.parent().removeClass('has-error has-success');
    }

    function updateMassActions() {
        if ($('input.select-file:checked').length > 0) {
            $('#mass_actions').removeClass('disabled');
        } else {
            $('#mass_actions').addClass('disabled');
        }
    }

    function deleteSelected() {
        var selectedIds = [];
        var selectedItems = [];
        var selectedItemsElements = [];

        $('input.select-file:checked').each(function () {
            var $parent = $($(this).closest('tr'));
            var id = $parent.find('[data-action="deallocate"]').data('id');
            var $ip = $parent.find('td[data-identifier="ip"]');
            var $port = $parent.find('td[data-identifier="port"]');
            var block = `${$ip.text()}:${$port.text()}`;

            selectedIds.push({
                id: id
            });
            selectedItems.push(block);
            selectedItemsElements.push($parent);
        });

        if (selectedItems.length !== 0) {
            var formattedItems = "";
            var i = 0;
            $.each(selectedItems, function (key, value) {
                formattedItems += ("<code>" + value + "</code>, ");
                i++;
                return i < 5;
            });

            formattedItems = formattedItems.slice(0, -2);
            if (selectedItems.length > 5) {
                formattedItems += ', and ' + (selectedItems.length - 5) + ' other(s)';
            }

            swal({
                type: 'warning',
                title: '',
                text: 'Are you sure you want to delete the following allocations: ' + formattedItems + '?',
                html: true,
                showCancelButton: true,
                showConfirmButton: true,
                closeOnConfirm: false,
                showLoaderOnConfirm: true
            }, function () {
                $.ajax({
                    method: 'DELETE',
                    url: '/admin/nodes/view/' + {{ $node->id }} + '/allocations',
                    headers: {'X-CSRF-TOKEN': $('meta[name="_token"]').attr('content')},
                    data: JSON.stringify({
                        allocations: selectedIds
                    }),
                    contentType: 'application/json',
                    processData: false
                }).done(function () {
                    $('#file_listing input:checked').each(function () {
                        $(this).prop('checked', false);
                    });

                    $.each(selectedItemsElements, function () {
                        $(this).addClass('warning').delay(200).fadeOut();
                    });

                    swal({
                        type: 'success',
                        title: 'Allocations Deleted'
                    });
                }).fail(function (jqXHR) {
                    console.error(jqXHR);
                    swal({
                        type: 'error',
                        title: 'Whoops!',
                        html: true,
                        text: 'An error occurred while attempting to delete these allocations. Please try again.',
                    });
                });
            });
        } else {
            swal({
                type: 'warning',
                title: '',
                text: 'Please select allocation(s) to delete.',
            });
        }
    }
    </script>
@endsection
