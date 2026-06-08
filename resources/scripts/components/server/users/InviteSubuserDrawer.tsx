import React, { useEffect } from 'react';
import { Form, Formik, FormikHelpers } from 'formik';
import { array, object, string } from 'yup';
import { Actions, useStoreActions, useStoreState } from 'easy-peasy';
import tw from 'twin.macro';
import Drawer from '@/components/elements/Drawer';
import FlashMessageRender from '@/components/FlashMessageRender';
import Can from '@/components/elements/Can';
import { usePermissions } from '@/plugins/usePermissions';
import { Button } from '@/components/elements/button/index';
import Label from '@/components/elements/Label';
import { Textarea } from '@/components/elements/Input';
import PermissionSection from '@/components/server/users/PermissionSection';
import PermissionRow from '@/components/server/users/PermissionRow';
import SubuserPermissionControls from '@/components/server/users/SubuserPermissionControls';
import useEditableSubuserPermissions from '@/components/server/users/useEditableSubuserPermissions';
import { parseInviteEmails } from '@/components/server/users/parseInviteEmails';
import createOrUpdateSubuser from '@/api/server/users/createOrUpdateSubuser';
import { ServerContext } from '@/state/server';
import { Subuser } from '@/state/server/subusers';
import { ApplicationStore } from '@/state';
import { httpErrorToHuman } from '@/api/http';

interface Values {
    emails: string;
    permissions: string[];
}

interface Props {
    visible: boolean;
    onDismissed: () => void;
}

const InviteSubuserDrawer = ({ visible, onDismissed }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const appendSubuser = ServerContext.useStoreActions((actions) => actions.subusers.appendSubuser);
    const { clearFlashes, addFlash, addError } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);
    const permissions = useStoreState((state) => state.permissions.data);
    const isRootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const loggedInPermissions = ServerContext.useStoreState((state) => state.server.permissions);
    const [canCreateUser] = usePermissions(['user.create']);
    const editablePermissions = useEditableSubuserPermissions();

    useEffect(
        () => () => {
            clearFlashes('user:edit');
        },
        [clearFlashes]
    );

    const handleDismiss = () => {
        clearFlashes('user:edit');
        onDismissed();
    };

    const submit = async (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('user:edit');

        const emails = parseInviteEmails(values.emails);
        const results = await Promise.allSettled(
            emails.map((email) => createOrUpdateSubuser(uuid, { email, permissions: values.permissions }))
        );

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
                    succeeded.length === 1 ? `Invited ${succeeded[0].email}.` : `Invited ${succeeded.length} users.`,
            });
            setSubmitting(false);
            handleDismiss();
            return;
        }

        if (succeeded.length > 0) {
            addFlash({
                type: 'warning',
                key: 'user:edit',
                message: `Invited ${succeeded.length} user(s). Failed: ${failed.join('; ')}`,
            });
            setSubmitting(false);
            handleDismiss();
            return;
        }

        addError({ key: 'user:edit', message: failed.join('; ') });
        setSubmitting(false);
    };

    return (
        <Formik
            onSubmit={submit}
            initialValues={{ emails: '', permissions: [] } as Values}
            validationSchema={object().shape({
                emails: string()
                    .required('Enter at least one email address.')
                    .test('valid-emails', 'One or more email addresses are invalid.', (value) => {
                        const emails = parseInviteEmails(value || '');
                        if (emails.length === 0) {
                            return false;
                        }

                        return emails.every((email) => string().email().isValidSync(email) && email.length <= 191);
                    }),
                permissions: array().of(string()),
            })}
            enableReinitialize
        >
            {({ values, errors, touched, handleChange, handleBlur, isSubmitting, resetForm }) => {
                const inviteCount = parseInviteEmails(values.emails).length;

                return (
                    <Drawer
                        visible={visible}
                        onDismissed={() => {
                            resetForm();
                            handleDismiss();
                        }}
                        title={'Invite users'}
                        subtitle={'Add one or more people to this server. One email per line.'}
                        width={'42rem'}
                        dismissable={!isSubmitting}
                        closeOnBackground={!isSubmitting}
                        closeOnEscape={!isSubmitting}
                    >
                        <Form css={tw`flex flex-col min-h-full m-0`}>
                            <div css={tw`space-y-4 flex-1`}>
                                <FlashMessageRender byKey={'user:edit'} />

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

                                {!isRootAdmin && loggedInPermissions[0] !== '*' && (
                                    <p className={'text-xs text-neutral-400 border border-realm-border/60 rounded px-3 py-2 m-0'}>
                                        You can only assign permissions your account already has.
                                    </p>
                                )}

                                {canCreateUser && (
                                    <SubuserPermissionControls
                                        editablePermissions={editablePermissions}
                                        showPresets
                                    />
                                )}

                                <div>
                                    {Object.keys(permissions)
                                        .filter((key) => key !== 'websocket')
                                        .map((key) => (
                                            <PermissionSection
                                                key={`permission_${key}`}
                                                title={key}
                                                description={permissions[key].description}
                                                isEditable={canCreateUser}
                                                permissions={Object.keys(permissions[key].keys).map(
                                                    (pkey) => `${key}.${pkey}`
                                                )}
                                            >
                                                <div className={'grid grid-cols-1 md:grid-cols-2 gap-0.5'}>
                                                    {Object.keys(permissions[key].keys).map((pkey) => (
                                                        <PermissionRow
                                                            key={`permission_${key}.${pkey}`}
                                                            permission={`${key}.${pkey}`}
                                                            disabled={
                                                                !canCreateUser ||
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

                            <Can action={'user.create'}>
                                <div css={tw`mt-6 pt-4 border-t border-realm-border flex justify-end gap-3`}>
                                    <Button.Text
                                        size={Button.Sizes.Small}
                                        type={'button'}
                                        onClick={handleDismiss}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </Button.Text>
                                    <Button size={Button.Sizes.Small} type={'submit'} disabled={isSubmitting}>
                                        {isSubmitting
                                            ? 'Sending…'
                                            : inviteCount > 1
                                              ? `Send ${inviteCount} invites`
                                              : 'Send invite'}
                                    </Button>
                                </div>
                            </Can>
                        </Form>
                    </Drawer>
                );
            }}
        </Formik>
    );
};

export default InviteSubuserDrawer;
