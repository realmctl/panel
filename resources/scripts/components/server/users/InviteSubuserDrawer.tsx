import React, { useEffect, useState } from 'react';
import { Form, Formik, FormikHelpers } from 'formik';
import { array, object, string } from 'yup';
import { Actions, useStoreActions, useStoreState } from 'easy-peasy';
import classNames from 'classnames';
import tw from 'twin.macro';
import Modal from '@/components/elements/Modal';
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

const STEPS = ['Emails', 'Permissions', 'Review'] as const;

const isValidEmailList = (value: string) => {
    const emails = parseInviteEmails(value || '');
    if (emails.length === 0) return false;
    return emails.every((email) => string().email().isValidSync(email) && email.length <= 191);
};

const InviteSubuserDrawer = ({ visible, onDismissed }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const appendSubuser = ServerContext.useStoreActions((actions) => actions.subusers.appendSubuser);
    const { clearFlashes, addFlash, addError } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);
    const permissions = useStoreState((state) => state.permissions.data);
    const getPermissions = useStoreActions((actions: Actions<ApplicationStore>) => actions.permissions.getPermissions);
    const isRootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const loggedInPermissions = ServerContext.useStoreState((state) => state.server.permissions);
    const [canCreateUser] = usePermissions(['user.create']);
    const editablePermissions = useEditableSubuserPermissions();
    const [step, setStep] = useState(0);

    useEffect(
        () => () => {
            clearFlashes('user:edit');
        },
        [clearFlashes]
    );

    useEffect(() => {
        if (visible) setStep(0);
    }, [visible]);

    useEffect(() => {
        if (visible && Object.keys(permissions).length === 0) {
            getPermissions().catch((error) => console.error(error));
        }
    }, [visible]);

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
            initialValues={{ emails: '', permissions: ['websocket.connect'] } as Values}
            validationSchema={object().shape({
                emails: string()
                    .required('Enter at least one email address.')
                    .test('valid-emails', 'One or more email addresses are invalid.', (value) =>
                        isValidEmailList(value || '')
                    ),
                permissions: array().of(string()),
            })}
            enableReinitialize
        >
            {({ values, errors, touched, handleChange, handleBlur, isSubmitting, resetForm, setFieldTouched }) => {
                const inviteCount = parseInviteEmails(values.emails).length;
                const emailsValid = isValidEmailList(values.emails);

                const goNext = () => {
                    if (step === 0) {
                        setFieldTouched('emails', true);
                        if (!emailsValid) return;
                    }
                    setStep((current) => Math.min(current + 1, STEPS.length - 1));
                };

                const goBack = () => setStep((current) => Math.max(current - 1, 0));

                return (
                    <Modal
                        visible={visible}
                        onDismissed={() => {
                            resetForm();
                            handleDismiss();
                        }}
                        dismissable={!isSubmitting}
                        closeOnBackground={!isSubmitting}
                        closeOnEscape={!isSubmitting}
                        wide
                    >
                        <Form css={tw`flex m-0 h-[32rem] max-h-[80vh]`}>
                            <div className={'w-44 sm:w-52 flex-shrink-0 border-r border-realm-border/50 p-5'}>
                                <h2 className={'text-base font-semibold text-neutral-100 m-0 mb-5'}>Invite People</h2>
                                <div>
                                    {STEPS.map((label, index) => {
                                        const active = index === step;
                                        const done = index < step;

                                        return (
                                            <div key={label} className={'flex items-start gap-3'}>
                                                <div className={'flex flex-col items-center flex-shrink-0'}>
                                                    <div
                                                        className={classNames(
                                                            'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0',
                                                            active || done
                                                                ? 'bg-blue-500 text-white'
                                                                : 'bg-transparent border border-realm-border text-neutral-500'
                                                        )}
                                                    >
                                                        {index + 1}
                                                    </div>
                                                    {index < STEPS.length - 1 && (
                                                        <div
                                                            className={classNames(
                                                                'w-px flex-1 my-1',
                                                                done ? 'bg-blue-500' : 'bg-realm-border'
                                                            )}
                                                            style={{ minHeight: '1.25rem' }}
                                                        />
                                                    )}
                                                </div>
                                                <span
                                                    className={classNames(
                                                        'text-sm mt-0.5 pb-6',
                                                        active ? 'text-neutral-100 font-semibold' : 'text-neutral-500'
                                                    )}
                                                >
                                                    {label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className={'flex-1 flex flex-col min-h-0'}>
                                <div className={'flex-1 overflow-y-auto p-6'}>
                                    <p className={'text-xs font-semibold text-blue-400 uppercase tracking-wide mb-1'}>
                                        Step {step + 1} of {STEPS.length}
                                    </p>

                                    <FlashMessageRender byKey={'user:edit'} className={'mb-4'} />

                                    {step === 0 && (
                                        <>
                                            <h3 className={'text-xl font-semibold text-neutral-100 m-0 mb-1'}>
                                                Who do you want to invite?
                                            </h3>
                                            <p className={'text-sm text-neutral-400 mb-5'}>
                                                Add one or more people to this server. One email per line.
                                            </p>

                                            <Label>Email addresses</Label>
                                            <Textarea
                                                name={'emails'}
                                                value={values.emails}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                rows={6}
                                                placeholder={'user@example.com\nfriend@example.com'}
                                                className={'w-full mt-1'}
                                            />
                                            <p className={'text-xs text-neutral-500 mt-1 m-0'}>
                                                Separate multiple addresses with a new line, comma, or semicolon. Each
                                                user must already have a panel account.
                                                {inviteCount > 1 && (
                                                    <span className={'text-neutral-400'}> · {inviteCount} addresses</span>
                                                )}
                                            </p>
                                            {touched.emails && errors.emails && (
                                                <p className={'text-xs text-red-400 mt-1 m-0'}>{errors.emails}</p>
                                            )}
                                        </>
                                    )}

                                    {step === 1 && (
                                        <>
                                            <h3 className={'text-xl font-semibold text-neutral-100 m-0 mb-1'}>
                                                Set permissions
                                            </h3>
                                            <p className={'text-sm text-neutral-400 mb-5'}>
                                                Apply a saved template or pick individual permissions for{' '}
                                                {inviteCount > 1 ? `these ${inviteCount} invites` : 'this invite'}.
                                            </p>

                                            {!isRootAdmin && loggedInPermissions[0] !== '*' && (
                                                <p className={'text-xs text-neutral-400 border border-realm-border/60 rounded px-3 py-2 mb-4'}>
                                                    You can only assign permissions your account already has.
                                                </p>
                                            )}

                                            {canCreateUser && (
                                                <SubuserPermissionControls
                                                    editablePermissions={editablePermissions}
                                                    showPresets
                                                />
                                            )}

                                            <div className={'mt-4'}>
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
                                        </>
                                    )}

                                    {step === 2 && (
                                        <>
                                            <h3 className={'text-xl font-semibold text-neutral-100 m-0 mb-1'}>
                                                Review Information
                                            </h3>
                                            <p className={'text-sm text-neutral-400 mb-5'}>
                                                Make sure everything looks good!
                                            </p>

                                            <div className={'rounded-md border border-realm-border/60 divide-y divide-realm-border/50'}>
                                                <div className={'flex items-start justify-between gap-4 px-4 py-3'}>
                                                    <span className={'text-sm text-neutral-500 flex-shrink-0'}>
                                                        {inviteCount > 1 ? 'Invites' : 'Invite'}
                                                    </span>
                                                    <span className={'text-sm text-neutral-200 text-right'}>
                                                        {parseInviteEmails(values.emails).join(', ')}
                                                    </span>
                                                </div>
                                                <div className={'flex items-center justify-between px-4 py-3'}>
                                                    <span className={'text-sm text-neutral-500'}>Permissions</span>
                                                    <span className={'text-sm text-neutral-200'}>
                                                        {values.permissions.filter((p) => p !== 'websocket.connect')
                                                            .length}{' '}
                                                        selected
                                                    </span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <Can action={'user.create'}>
                                    <div className={'flex items-center justify-between gap-3 px-6 py-4 border-t border-realm-border/50'}>
                                        <Button.Text
                                            size={Button.Sizes.Small}
                                            type={'button'}
                                            onClick={step === 0 ? handleDismiss : goBack}
                                            disabled={isSubmitting}
                                        >
                                            {step === 0 ? 'Cancel' : 'Back'}
                                        </Button.Text>

                                        {step < STEPS.length - 1 ? (
                                            <Button key={'nav-next'} size={Button.Sizes.Small} type={'button'} onClick={goNext}>
                                                Next Step
                                            </Button>
                                        ) : (
                                            <Button key={'nav-submit'} size={Button.Sizes.Small} type={'submit'} disabled={isSubmitting}>
                                                {isSubmitting
                                                    ? 'Sending…'
                                                    : inviteCount > 1
                                                      ? `Send ${inviteCount} invites`
                                                      : 'Send invite'}
                                            </Button>
                                        )}
                                    </div>
                                </Can>
                            </div>
                        </Form>
                    </Modal>
                );
            }}
        </Formik>
    );
};

export default InviteSubuserDrawer;
