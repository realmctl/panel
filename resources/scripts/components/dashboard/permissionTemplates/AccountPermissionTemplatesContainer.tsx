import React, { useEffect } from 'react';
import { Actions, useStoreActions, useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import PageContentBlock from '@/components/elements/PageContentBlock';
import FlashMessageRender from '@/components/FlashMessageRender';
import CreatePermissionTemplateForm from '@/components/dashboard/permissionTemplates/CreatePermissionTemplateForm';
import DeletePermissionTemplateButton from '@/components/dashboard/permissionTemplates/DeletePermissionTemplateButton';
import { useFlashKey } from '@/plugins/useFlash';

const cardStyle = { backgroundColor: '#192024', border: '1px solid #2d3338' } as React.CSSProperties;
const cardHeaderStyle = { backgroundColor: '#0e1417', borderBottom: '1px solid #2d3338' } as React.CSSProperties;
const rowStyle = { backgroundColor: '#0e1417', borderBottom: '1px solid #2d3338' } as React.CSSProperties;

export default () => {
    const { clearAndAddHttpError } = useFlashKey('account:permission-templates');
    const templates = useStoreState((state: ApplicationStore) => state.permissionTemplates.data);
    const fetchTemplates = useStoreActions(
        (actions: Actions<ApplicationStore>) => actions.permissionTemplates.fetchTemplates
    );
    const getPermissions = useStoreActions((actions: Actions<ApplicationStore>) => actions.permissions.getPermissions);

    useEffect(() => {
        fetchTemplates().catch((error) => clearAndAddHttpError(error));
        getPermissions().catch((error) => clearAndAddHttpError(error));
    }, []);

    return (
        <PageContentBlock title={'Permission Templates'}>
            <FlashMessageRender byKey={'account:permission-templates'} />
            <div className={'grid grid-cols-1 lg:grid-cols-2 gap-4'} style={{ marginTop: '2.5rem' }}>
                <div className={'rounded-lg overflow-hidden'} style={cardStyle}>
                    <div className={'px-4 py-3'} style={cardHeaderStyle}>
                        <h3 className={'text-sm font-semibold text-neutral-100'}>Create Template</h3>
                    </div>
                    <div className={'px-4 py-4'}>
                        <CreatePermissionTemplateForm />
                    </div>
                </div>
                <div className={'rounded-lg overflow-hidden'} style={cardStyle}>
                    <div className={'px-4 py-3'} style={cardHeaderStyle}>
                        <h3 className={'text-sm font-semibold text-neutral-100'}>Your Templates</h3>
                    </div>
                    <div className={'px-4 py-4'}>
                        {!templates.length ? (
                            <p className={'text-center text-sm text-neutral-400'}>
                                No permission templates yet. Create one to quickly assign a consistent set of
                                permissions to subusers.
                            </p>
                        ) : (
                            <div className={'space-y-2'}>
                                {templates.map((template) => (
                                    <div
                                        key={template.uuid}
                                        className={'flex items-center gap-3 p-3 rounded'}
                                        style={rowStyle}
                                    >
                                        <div className={'flex-1 overflow-hidden'}>
                                            <p className={'text-sm font-medium break-words'}>{template.name}</p>
                                            <p className={'text-xs mt-1 text-neutral-400'}>
                                                {template.permissions.length} permission
                                                {template.permissions.length === 1 ? '' : 's'}
                                            </p>
                                        </div>
                                        <DeletePermissionTemplateButton uuid={template.uuid} name={template.name} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageContentBlock>
    );
};
