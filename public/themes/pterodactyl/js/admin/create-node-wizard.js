$(function () {
    if (typeof initAdminWizard !== 'function') return;

    initAdminWizard({
        root: '.create-server.create-node',
        form: '#createNodeForm',
        backBtn: '#createNodeBack',
        nextBtn: '#createNodeNext',
        submitBtn: '#createNodeSubmit',
        totalSteps: 4,
        stepFields: {
            1: ['#pName', '#pLocationId'],
            2: ['#pFQDN'],
            3: ['#pMemory', '#pDisk', '#pMemoryOverallocate', '#pDiskOverallocate'],
            4: ['#pDaemonBase', '#pDaemonListen', '#pDaemonSFTP'],
        },
        onStepShown: function () {
            if (typeof refreshCreateNodeSelect2Widths === 'function') {
                refreshCreateNodeSelect2Widths();
            }
        },
    });
});
