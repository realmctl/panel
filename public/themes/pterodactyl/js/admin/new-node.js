const createNodeSelect2Defaults = {
    width: '100%',
    dropdownParent: $(document.body),
};

function applyNodeSelect2($el, options) {
    if (!$el.length) return $el;

    if ($el.hasClass('select2-hidden-accessible')) {
        $el.select2('destroy');
    }

    $el.select2($.extend({}, createNodeSelect2Defaults, options || {}));
    return $el;
}

function refreshCreateNodeSelect2Widths() {
    $('.create-node .create-server-panel.is-active .select2-hidden-accessible').each(function () {
        $(this).next('.select2-container').css('width', '100%');
    });
}

function markNodeSelect2Invalid($el, invalid) {
    $el.toggleClass('is-invalid', invalid);
    $el.next('.select2-container').find('.select2-selection').toggleClass('is-invalid', invalid);
}

window.markSelect2Invalid = markNodeSelect2Invalid;

function initCreateNodeSelects() {
    applyNodeSelect2($('#pLocationId'), { placeholder: 'Select a location' });
    refreshCreateNodeSelect2Widths();
    initConnectionPreview();
}

function initConnectionPreview() {
    const $fqdn = $('#pFQDN');
    const $preview = $('#connectionPreviewUrl');
    if (!$fqdn.length || !$preview.length) return;

    const update = function () {
        const host = ($fqdn.val() || '').trim() || 'node.example.com';
        const scheme = $('input[name="scheme"]:checked').val() || 'https';
        $preview.text(scheme + '://' + host);
    };

    $fqdn.on('input', update);
    $('input[name="scheme"]').on('change', update);
    update();
}
