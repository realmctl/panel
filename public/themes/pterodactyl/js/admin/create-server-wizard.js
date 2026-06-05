$(function () {
    if (typeof initAdminWizard !== 'function') return;

    initAdminWizard({
        root: '.create-server',
        form: '#createServerForm',
        backBtn: '#createServerBack',
        nextBtn: '#createServerNext',
        submitBtn: '#createServerSubmit',
        totalSteps: 5,
        stepFields: {
            1: ['#pName', '#pUserId'],
            2: ['#pNodeId', '#pAllocation'],
            3: ['#pMemory', '#pDisk'],
            4: ['#pNestId', '#pEggId'],
            5: ['#pStartup'],
        },
        onStepShown: function () {
            if (typeof refreshCreateServerSelect2Widths === 'function') {
                refreshCreateServerSelect2Widths();
            }
        },
    });
});
