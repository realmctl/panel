import React, { useEffect } from 'react';
import { Actions, useStoreActions, useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import FlashMessageRender from '@/components/FlashMessageRender';
import CreatePermissionTemplateForm from '@/components/dashboard/permissionTemplates/CreatePermissionTemplateForm';
import DeletePermissionTemplateButton from '@/components/dashboard/permissionTemplates/DeletePermissionTemplateButton';
import { useFlashKey } from '@/plugins/useFlash';
import RealmCard from '@/components/elements/realm/RealmCard';

const cardHeaderClassName = '!py-2.5 !bg-realm-card !border-realm-border/50';

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
        <>
            <FlashMessageRender byKey={'account:permission-templates'} className={'mb-4'} />
            <div className={'grid grid-cols-1 xl:grid-cols-2 gap-4'}>
                <RealmCard
                    rounded={'md'}
                    border={'soft'}
                    header={<h2 className={'text-base font-semibold text-neutral-100 m-0'}>Create Template</h2>}
                    headerClassName={cardHeaderClassName}
                >
                    <CreatePermissionTemplateForm />
                </RealmCard>

                <RealmCard
                    rounded={'md'}
                    border={'soft'}
                    header={<h2 className={'text-base font-semibold text-neutral-100 m-0'}>Your Templates</h2>}
                    headerClassName={cardHeaderClassName}
                >
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
                                    className={'flex items-center gap-3 p-3 rounded bg-realm-surface border border-realm-border'}
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
                </RealmCard>
            </div>
        </>
    );
};
