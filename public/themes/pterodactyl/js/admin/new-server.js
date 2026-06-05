const createServerSelect2Defaults = {
    width: '100%',
    dropdownParent: $(document.body),
};

function applySelect2($el, options) {
    if (!$el.length) return $el;

    if ($el.hasClass('select2-hidden-accessible')) {
        $el.select2('destroy');
    }

    $el.select2($.extend({}, createServerSelect2Defaults, options || {}));
    return $el;
}

function refreshCreateServerSelect2Widths() {
    $('.create-server-panel.is-active .select2-hidden-accessible').each(function () {
        $(this).next('.select2-container').css('width', '100%');
    });
}

function markSelect2Invalid($el, invalid) {
    $el.toggleClass('is-invalid', invalid);
    $el.next('.select2-container').find('.select2-selection').toggleClass('is-invalid', invalid);
}

function initCreateServerSelects() {
    applySelect2($('#pNestId'), { placeholder: 'Select a nest' });
    applySelect2($('#pEggId'), { placeholder: 'Select an egg' });
    applySelect2($('#pNodeId'), { placeholder: 'Select a node' });
    applySelect2($('#pAllocation'), { placeholder: 'Select primary allocation' });
    applySelect2($('#pAllocationAdditional'), { placeholder: 'Select additional allocations' });
    applySelect2($('#pDefaultContainer'), { placeholder: 'Select a Docker image' });

    $('#pNestId').trigger('change');
    $('#pNodeId').trigger('change');
    refreshCreateServerSelect2Widths();
}

$(document).ready(function () {
    $('#pNestId').on('change', function () {
        applySelect2($('#pEggId'), {
            placeholder: 'Select an egg',
            data: $.map(_.get(Pterodactyl.nests, $(this).val() + '.eggs', []), function (item) {
                return { id: item.id, text: item.name };
            }),
        }).trigger('change');
    });

    $('#pEggId').on('change', function () {
        const parentChain = _.get(Pterodactyl.nests, $('#pNestId').val(), null);
        const objectChain = _.get(parentChain, 'eggs.' + $(this).val(), null);

        const images = _.get(objectChain, 'docker_images', {});
        $('#pDefaultContainer').html('');
        const keys = Object.keys(images);
        for (let i = 0; i < keys.length; i++) {
            const opt = document.createElement('option');
            opt.value = images[keys[i]];
            opt.innerText = keys[i] + ' (' + images[keys[i]] + ')';
            $('#pDefaultContainer').append(opt);
        }
        applySelect2($('#pDefaultContainer'), { placeholder: 'Select a Docker image' });

        $('#pDefaultContainer').off('change.cs').on('change.cs', function () {
            $('#pDefaultContainerCustom').val('');
        });

        if (!_.get(objectChain, 'startup', false)) {
            $('#pStartup').val(_.get(parentChain, 'startup', 'ERROR: Startup Not Defined!'));
        } else {
            $('#pStartup').val(_.get(objectChain, 'startup'));
        }

        const variableIds = {};
        const variables = _.get(objectChain, 'variables', []);
        $('#appendVariablesTo').html('');

        if (!variables.length) {
            $('#appendVariablesTo').html('<div class="col-12 text-secondary">This egg has no service variables.</div>');
        }

        $.each(variables, function (i, item) {
            variableIds[item.env_variable] = 'var_ref_' + item.id;

            const isRequired = item.required === 1 ? '<span class="badge bg-danger-lt me-1">Required</span>' : '';
            const dataAppend = ' \
                <div class="col-md-6"> \
                    <div class="create-server-var-field"> \
                        <label for="var_ref_' + escapeHtml(item.id) + '" class="form-label">' + isRequired + escapeHtml(item.name) + '</label> \
                        <input type="text" id="var_ref_' + escapeHtml(item.id) + '" autocomplete="off" name="environment[' + escapeHtml(item.env_variable) + ']" class="form-control font-monospace" value="' + escapeHtml(item.default_value) + '" /> \
                        <span class="form-hint d-block mt-2">' + escapeHtml(item.description) + '</span> \
                        <div class="create-server-var-meta"> \
                            <span><strong>Variable:</strong> <code>{{' + escapeHtml(item.env_variable) + '}}</code></span> \
                            <span><strong>Rules:</strong> <code>' + escapeHtml(item.rules) + '</code></span> \
                        </div> \
                    </div> \
                </div> \
            ';
            $('#appendVariablesTo').append(dataAppend);
        });

        serviceVariablesUpdated($('#pEggId').val(), variableIds);
        refreshCreateServerSelect2Widths();
    });

    $('#pNodeId').on('change', function () {
        const currentNode = $(this).val();
        $.each(Pterodactyl.nodeData, function (i, v) {
            if (v.id == currentNode) {
                applySelect2($('#pAllocation'), {
                    data: v.allocations,
                    placeholder: 'Select primary allocation',
                });
                updateAdditionalAllocations();
            }
        });
    });

    $('#pAllocation').on('change', function () {
        updateAdditionalAllocations();
    });
});

function updateAdditionalAllocations() {
    const currentAllocation = $('#pAllocation').val();
    const currentNode = $('#pNodeId').val();

    $.each(Pterodactyl.nodeData, function (i, v) {
        if (v.id == currentNode) {
            const allocations = [];
            for (let i = 0; i < v.allocations.length; i++) {
                const allocation = v.allocations[i];
                if (allocation.id != currentAllocation) {
                    allocations.push(allocation);
                }
            }
            applySelect2($('#pAllocationAdditional'), {
                data: allocations,
                placeholder: 'Select additional allocations',
            });
        }
    });
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function initUserIdSelect(data) {
    applySelect2($('#pUserId'), {
        ajax: {
            url: '/admin/users/accounts.json',
            dataType: 'json',
            delay: 250,
            data: function (params) {
                return {
                    filter: { email: params.term },
                    page: params.page,
                };
            },
            processResults: function (data) {
                return { results: data };
            },
            cache: true,
        },
        data: data,
        placeholder: 'Search for a user by email…',
        allowClear: true,
        escapeMarkup: function (markup) { return markup; },
        minimumInputLength: 2,
        templateResult: function (data) {
            if (data.loading) return escapeHtml(data.text);
            if (!data.email) return escapeHtml(data.text);

            return (
                '<div class="create-server-user-option">' +
                    '<span class="create-server-user-name">' + escapeHtml(data.name_first) + ' ' + escapeHtml(data.name_last) + '</span>' +
                    '<span class="create-server-user-email">' + escapeHtml(data.email) + '</span>' +
                '</div>'
            );
        },
        templateSelection: function (data) {
            if (!data.id) return data.text;
            if (typeof data.email === 'undefined') return data.text;

            return escapeHtml(data.name_first) + ' ' + escapeHtml(data.name_last) + ' · ' + escapeHtml(data.email);
        },
    });
}
