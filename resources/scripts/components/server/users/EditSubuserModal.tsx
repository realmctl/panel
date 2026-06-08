import React, { useContext, useEffect, useRef } from 'react';
import { Subuser } from '@/state/server/subusers';
import { Form, Formik } from 'formik';
import { array, object, string } from 'yup';
import { Actions, useStoreActions, useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import createOrUpdateSubuser from '@/api/server/users/createOrUpdateSubuser';
import { ServerContext } from '@/state/server';
import FlashMessageRender from '@/components/FlashMessageRender';
import Can from '@/components/elements/Can';
import { usePermissions } from '@/plugins/usePermissions';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import PermissionSection from '@/components/server/users/PermissionSection';
import asModal from '@/hoc/asModal';
import PermissionRow from '@/components/server/users/PermissionRow';
import ModalContext from '@/context/ModalContext';
import SubuserPermissionControls from '@/components/server/users/SubuserPermissionControls';
import useEditableSubuserPermissions from '@/components/server/users/useEditableSubuserPermissions';

type Props = {
    subuser: Subuser;
};

interface Values {
    permissions: string[];
}

const EditSubuserModal = ({ subuser }: Props) => {
    const ref = useRef<HTMLHeadingElement>(null);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const appendSubuser = ServerContext.useStoreActions((actions) => actions.subusers.appendSubuser);
    const { clearFlashes, clearAndAddHttpError } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);
    const { dismiss, setPropOverrides } = useContext(ModalContext);

    const isRootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const permissions = useStoreState((state) => state.permissions.data);
    const loggedInPermissions = ServerContext.useStoreState((state) => state.server.permissions);
    const [canEditUser] = usePermissions(['user.update']);
    const editablePermissions = useEditableSubuserPermissions();

    const submit = (values: Values) => {
        setPropOverrides({ showSpinnerOverlay: true });
        clearFlashes('user:edit');

        createOrUpdateSubuser(uuid, { email: subuser.email, permissions: values.permissions }, subuser)
            .then((updated) => {
                appendSubuser(updated);
                dismiss();
            })
            .catch((error) => {
                console.error(error);
                setPropOverrides(null);
                clearAndAddHttpError({ key: 'user:edit', error });

                if (ref.current) {
                    ref.current.scrollIntoView();
                }
            });
    };

    useEffect(
        () => () => {
            clearFlashes('user:edit');
        },
        [clearFlashes]
    );

    return (
        <Formik
            onSubmit={submit}
            initialValues={{ permissions: subuser.permissions } as Values}
            validationSchema={object().shape({
                permissions: array().of(string()),
            })}
        >
            <Form className={'flex flex-col h-full min-h-0 max-h-[calc(100vh-8rem)]'}>
                <div className={'px-5 py-4 border-b border-realm-border shrink-0'}>
                    <h2 className={'text-base font-semibold text-neutral-100 m-0'} ref={ref}>
                        {canEditUser ? 'Edit' : 'View'} user
                    </h2>
                    <p className={'text-xs text-neutral-500 mt-1 mb-0'}>{subuser.email}</p>
                    <FlashMessageRender byKey={'user:edit'} css={tw`mt-3`} />
                </div>

                <div className={'flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 space-y-4'}>
                    {!isRootAdmin && loggedInPermissions[0] !== '*' && (
                        <p className={'text-xs text-neutral-400 border border-realm-border/60 rounded px-3 py-2 m-0'}>
                            You can only assign permissions your account already has.
                        </p>
                    )}

                    {canEditUser && <SubuserPermissionControls editablePermissions={editablePermissions} />}

                    <div>
                        {Object.keys(permissions)
                            .filter((key) => key !== 'websocket')
                            .map((key) => (
                                <PermissionSection
                                    key={`permission_${key}`}
                                    title={key}
                                    description={permissions[key].description}
                                    isEditable={canEditUser}
                                    permissions={Object.keys(permissions[key].keys).map((pkey) => `${key}.${pkey}`)}
                                >
                                    <div className={'grid grid-cols-1 md:grid-cols-2 gap-0.5'}>
                                        {Object.keys(permissions[key].keys).map((pkey) => (
                                            <PermissionRow
                                                key={`permission_${key}.${pkey}`}
                                                permission={`${key}.${pkey}`}
                                                disabled={
                                                    !canEditUser || editablePermissions.indexOf(`${key}.${pkey}`) < 0
                                                }
                                                compact
                                            />
                                        ))}
                                    </div>
                                </PermissionSection>
                            ))}
                    </div>
                </div>

                <Can action={'user.update'}>
                    <div className={'px-5 py-4 border-t border-realm-border flex justify-end gap-2 shrink-0'}>
                        <button
                            type={'button'}
                            onClick={() => dismiss()}
                            className={
                                'px-3 py-1.5 text-xs font-medium rounded border border-realm-border text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer bg-transparent'
                            }
                        >
                            Cancel
                        </button>
                        <Button type={'submit'} size={Button.Sizes.Small}>
                            Save changes
                        </Button>
                    </div>
                </Can>
            </Form>
        </Formik>
    );
};

export default asModal<Props>({
    top: false,
    wide: true,
})(EditSubuserModal);
