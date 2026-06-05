import React, { useContext, useEffect, useRef } from 'react';
import { Subuser } from '@/state/server/subusers';
import { Form, Formik, useFormikContext } from 'formik';
import { array, object, string } from 'yup';
import { Actions, useStoreActions, useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import createOrUpdateSubuser from '@/api/server/users/createOrUpdateSubuser';
import { ServerContext } from '@/state/server';
import FlashMessageRender from '@/components/FlashMessageRender';
import Can from '@/components/elements/Can';
import { usePermissions } from '@/plugins/usePermissions';
import { useDeepCompareMemo } from '@/plugins/useDeepCompareMemo';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import PermissionSection from '@/components/server/users/PermissionSection';
import asModal from '@/hoc/asModal';
import PermissionRow from '@/components/server/users/PermissionRow';
import ModalContext from '@/context/ModalContext';
import { PERMISSION_PRESETS, resolvePresetPermissions } from '@/components/server/users/userPermissionPresets';
import { parseInviteEmails } from '@/components/server/users/parseInviteEmails';
import classNames from 'classnames';
import Label from '@/components/elements/Label';
import { Textarea } from '@/components/elements/Input';
import { httpErrorToHuman } from '@/api/http';

type Props = {
    subuser?: Subuser;
};

interface Values {
    emails: string;
    permissions: string[];
}

const presetButtonClass = (active: boolean) =>
    classNames(
        'px-3 py-1.5 text-xs font-medium rounded border transition-colors duration-150 cursor-pointer',
        active
            ? 'border-blue-500/50 bg-blue-500/20 text-blue-200'
            : 'border-realm-border/60 bg-transparent text-neutral-300 hover:border-neutral-500 hover:bg-neutral-800/50'
    );

const PermissionControls = ({ editablePermissions, isCreate }: { editablePermissions: string[]; isCreate: boolean }) => {
    const { setFieldValue, values } = useFormikContext<Values>();
    const allSelected = editablePermissions.every((p) => values.permissions.includes(p));
    const selectedCount = values.permissions.filter((p) => p !== 'websocket.connect').length;

    const applyPreset = (presetId: string) => {
        setFieldValue('permissions', resolvePresetPermissions(presetId, editablePermissions));
    };

    const isPresetActive = (presetId: string) => {
        const presetPerms = resolvePresetPermissions(presetId, editablePermissions).sort().join(',');
        const currentPerms = [...values.permissions].sort().join(',');
        return presetPerms.length > 0 && presetPerms === currentPerms;
    };

    return (
        <div className={'pb-4 border-b border-realm-border/60'}>
            <div className={'flex flex-wrap items-center justify-between gap-3 mb-3'}>
                <div>
                    <p className={'text-sm font-medium text-neutral-100 m-0'}>Permission presets</p>
                    <p className={'text-xs text-neutral-500 mt-1 m-0'}>{selectedCount} selected</p>
                </div>
                <Button.Text type={'button'} onClick={() => setFieldValue('permissions', allSelected ? [] : editablePermissions)}>
                    {allSelected ? 'Clear all' : 'Select all'}
                </Button.Text>
            </div>
            {isCreate && (
                <div className={'flex flex-wrap gap-2'}>
                    {PERMISSION_PRESETS.map((preset) => (
                        <button
                            key={preset.id}
                            type={'button'}
                            title={preset.description}
                            className={presetButtonClass(isPresetActive(preset.id))}
                            onClick={() => applyPreset(preset.id)}
                        >
                            {preset.label}
                        </button>
                    ))}
                    <button
                        type={'button'}
                        title={'Grant every permission you can assign'}
                        className={presetButtonClass(isPresetActive('full'))}
                        onClick={() => applyPreset('full')}
                    >
                        Full access
                    </button>
                </div>
            )}
        </div>
    );
};

const EditSubuserModal = ({ subuser }: Props) => {
    const ref = useRef<HTMLHeadingElement>(null);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const appendSubuser = ServerContext.useStoreActions((actions) => actions.subusers.appendSubuser);
    const { clearFlashes, clearAndAddHttpError, addFlash, addError } = useStoreActions(
        (actions: Actions<ApplicationStore>) => actions.flashes
    );
    const { dismiss, setPropOverrides } = useContext(ModalContext);

    const isRootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const permissions = useStoreState((state) => state.permissions.data);
    const loggedInPermissions = ServerContext.useStoreState((state) => state.server.permissions);
    const [canEditUser] = usePermissions(subuser ? ['user.update'] : ['user.create']);
    const isCreate = !subuser;

    const editablePermissions = useDeepCompareMemo(() => {
        const cleaned = Object.keys(permissions).map((key) =>
            Object.keys(permissions[key].keys).map((pkey) => `${key}.${pkey}`)
        );

        const list: string[] = ([] as string[]).concat.apply([], Object.values(cleaned));

        if (isRootAdmin || (loggedInPermissions.length === 1 && loggedInPermissions[0] === '*')) {
            return list;
        }

        return list.filter((key) => loggedInPermissions.indexOf(key) >= 0);
    }, [isRootAdmin, permissions, loggedInPermissions]);

    const submit = async (values: Values) => {
        setPropOverrides({ showSpinnerOverlay: true });
        clearFlashes('user:edit');

        if (isCreate) {
            const emails = parseInviteEmails(values.emails);
            const results = await Promise.allSettled(
                emails.map((email) =>
                    createOrUpdateSubuser(uuid, { email, permissions: values.permissions })
                )
            );

            setPropOverrides(null);

            const succeeded: Subuser[] = [];
            const failed: string[] = [];

            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    succeeded.push(result.value);
                } else {
                    failed.push(`${emails[index]}: ${httpErrorToHuman(result.reason)}`);
                }
            });

            succeeded.forEach((user) => appendSubuser(user));

            if (failed.length === 0) {
                addFlash({
                    type: 'success',
                    key: 'users',
                    message:
                        succeeded.length === 1
                            ? `Invited ${succeeded[0].email}.`
                            : `Invited ${succeeded.length} users.`,
                });
                dismiss();
                return;
            }

            if (succeeded.length > 0) {
                addFlash({
                    type: 'warning',
                    key: 'user:edit',
                    message: `Invited ${succeeded.length} user(s). Failed: ${failed.join('; ')}`,
                });
                dismiss();
                return;
            }

            addError({ key: 'user:edit', message: failed.join('; ') });

            if (ref.current) {
                ref.current.scrollIntoView();
            }
            return;
        }

        createOrUpdateSubuser(uuid, { email: subuser!.email, permissions: values.permissions }, subuser)
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
        []
    );

    return (
        <Formik
            onSubmit={submit}
            initialValues={
                {
                    emails: '',
                    permissions: subuser?.permissions || [],
                } as Values
            }
            validationSchema={object().shape({
                emails: isCreate
                    ? string()
                          .required('Enter at least one email address.')
                          .test('valid-emails', 'One or more email addresses are invalid.', (value) => {
                              const emails = parseInviteEmails(value || '');
                              if (emails.length === 0) {
                                  return false;
                              }

                              return emails.every((email) => string().email().isValidSync(email) && email.length <= 191);
                          })
                    : string(),
                permissions: array().of(string()),
            })}
        >
            {({ values, errors, touched, handleChange, handleBlur }) => {
                const inviteCount = isCreate ? parseInviteEmails(values.emails).length : 0;

                return (
                    <Form className={'flex flex-col h-full min-h-0 max-h-[calc(100vh-8rem)]'}>
                        <div className={'px-5 py-4 border-b border-realm-border shrink-0'}>
                            <h2 className={'text-base font-semibold text-neutral-100 m-0'} ref={ref}>
                                {isCreate ? 'Invite users' : `${canEditUser ? 'Edit' : 'View'} user`}
                            </h2>
                            <p className={'text-xs text-neutral-500 mt-1 mb-0'}>
                                {isCreate
                                    ? 'Add one or more people to this server. One email per line.'
                                    : subuser!.email}
                            </p>
                            <FlashMessageRender byKey={'user:edit'} css={tw`mt-3`} />
                        </div>

                        <div className={'flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 space-y-4'}>
                            {isCreate && (
                                <div>
                                    <Label>Email addresses</Label>
                                    <Textarea
                                        name={'emails'}
                                        value={values.emails}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        rows={4}
                                        placeholder={'user@example.com\nfriend@example.com'}
                                        className={'w-full mt-1'}
                                    />
                                    <p className={'text-xs text-neutral-500 mt-1 m-0'}>
                                        Separate multiple addresses with a new line, comma, or semicolon. Each user must
                                        already have a panel account.
                                        {inviteCount > 1 && (
                                            <span className={'text-neutral-400'}> · {inviteCount} addresses</span>
                                        )}
                                    </p>
                                    {touched.emails && errors.emails && (
                                        <p className={'text-xs text-red-400 mt-1 m-0'}>{errors.emails}</p>
                                    )}
                                </div>
                            )}

                            {!isRootAdmin && loggedInPermissions[0] !== '*' && (
                                <p className={'text-xs text-neutral-400 border border-realm-border/60 rounded px-3 py-2 m-0'}>
                                    You can only assign permissions your account already has.
                                </p>
                            )}

                            {canEditUser && (
                                <PermissionControls editablePermissions={editablePermissions} isCreate={isCreate} />
                            )}

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
                                                            !canEditUser ||
                                                            editablePermissions.indexOf(`${key}.${pkey}`) < 0
                                                        }
                                                        compact
                                                    />
                                                ))}
                                            </div>
                                        </PermissionSection>
                                    ))}
                            </div>
                        </div>

                        <Can action={subuser ? 'user.update' : 'user.create'}>
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
                                    {isCreate
                                        ? inviteCount > 1
                                            ? `Send ${inviteCount} invites`
                                            : 'Send invite'
                                        : 'Save changes'}
                                </Button>
                            </div>
                        </Can>
                    </Form>
                );
            }}
        </Formik>
    );
};

export default asModal<Props>({
    top: false,
    wide: true,
})(EditSubuserModal);
