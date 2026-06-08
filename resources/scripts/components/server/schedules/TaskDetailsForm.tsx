import React, { useEffect } from 'react';
import { Schedule, Task } from '@/api/server/schedules/getServerSchedules';
import { Field as FormikField, Form, Formik, FormikHelpers, useField, useFormikContext } from 'formik';
import { ServerContext } from '@/state/server';
import createOrUpdateScheduleTask from '@/api/server/schedules/createOrUpdateScheduleTask';
import { httpErrorToHuman } from '@/api/http';
import Field from '@/components/elements/Field';
import FlashMessageRender from '@/components/FlashMessageRender';
import { boolean, number, object, string } from 'yup';
import useFlash from '@/plugins/useFlash';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import tw from 'twin.macro';
import Label from '@/components/elements/Label';
import { Textarea } from '@/components/elements/Input';
import Select from '@/components/elements/Select';
import FormikSwitch from '@/components/elements/FormikSwitch';

interface Values {
    action: string;
    payload: string;
    timeOffset: string;
    continueOnFailure: boolean;
    condition: string;
}

const schema = object().shape({
    action: string().required(),
    payload: string().when('action', {
        is: (v: string) => !['backup', 'delete_files'].includes(v),
        then: string().required('A task payload must be provided.'),
        otherwise: string(),
    }),
    continueOnFailure: boolean(),
    condition: string().nullable(),
    timeOffset: number()
        .typeError('The time offset must be a valid number between 0 and 900.')
        .required('A time offset value must be provided.')
        .min(0, 'The time offset must be at least 0 seconds.')
        .max(900, 'The time offset must be less than 900 seconds.'),
});

const ActionListener = () => {
    const [{ value }, { initialValue: initialAction }] = useField<string>('action');
    const [, { initialValue: initialPayload }, { setValue, setTouched }] = useField<string>('payload');

    useEffect(() => {
        if (value !== initialAction) {
            const defaults: Record<string, string> = {
                power: 'start',
                webhook: JSON.stringify({ url: '', method: 'POST', body: { content: 'Automation task completed.' } }, null, 2),
                email: JSON.stringify({ subject: 'Automation notification', body: 'An automation task ran on your server.' }, null, 2),
                command: '',
                backup: '',
                delete_files: '',
            };
            setValue(defaults[value] ?? '');
            setTouched(false);
        } else {
            setValue(initialPayload || '');
            setTouched(false);
        }
    }, [value, initialAction, initialPayload, setValue, setTouched]);

    return null;
};

const renderPayload = (action: string) => {
    switch (action) {
        case 'command':
            return (
                <div>
                    <Label>Payload</Label>
                    <FormikFieldWrapper name={'payload'}>
                        <FormikField as={Textarea} name={'payload'} rows={6} />
                    </FormikFieldWrapper>
                </div>
            );
        case 'power':
            return (
                <div>
                    <Label>Payload</Label>
                    <FormikFieldWrapper name={'payload'}>
                        <FormikField as={Select} name={'payload'}>
                            <option value={'start'}>Start the server</option>
                            <option value={'restart'}>Restart the server</option>
                            <option value={'stop'}>Stop the server</option>
                            <option value={'kill'}>Terminate the server</option>
                        </FormikField>
                    </FormikFieldWrapper>
                </div>
            );
        case 'backup':
            return (
                <div>
                    <Label>Ignored Files</Label>
                    <FormikFieldWrapper
                        name={'payload'}
                        description={
                            'Optional. Include the files and folders to be excluded in this backup. By default, the contents of your .realmignore file will be used. If you have reached your backup limit, the oldest backup will be rotated.'
                        }
                    >
                        <FormikField as={Textarea} name={'payload'} rows={6} />
                    </FormikFieldWrapper>
                </div>
            );
        case 'webhook':
            return (
                <div>
                    <Label>Webhook JSON</Label>
                    <FormikFieldWrapper
                        name={'payload'}
                        description={'JSON with url (required), optional method, headers, and body fields.'}
                    >
                        <FormikField as={Textarea} name={'payload'} rows={8} />
                    </FormikFieldWrapper>
                </div>
            );
        case 'email':
            return (
                <div>
                    <Label>Email JSON</Label>
                    <FormikFieldWrapper
                        name={'payload'}
                        description={'JSON with subject and body fields. Sent to the server owner.'}
                    >
                        <FormikField as={Textarea} name={'payload'} rows={6} />
                    </FormikFieldWrapper>
                </div>
            );
        case 'delete_files':
            return (
                <div>
                    <Label>File paths</Label>
                    <FormikFieldWrapper
                        name={'payload'}
                        description={'One file or folder path per line, relative to /.'}
                    >
                        <FormikField as={Textarea} name={'payload'} rows={6} />
                    </FormikFieldWrapper>
                </div>
            );
        default:
            return null;
    }
};

const SubmittingBridge = ({ onChange }: { onChange: (isSubmitting: boolean) => void }) => {
    const { isSubmitting } = useFormikContext();

    useEffect(() => {
        onChange(isSubmitting);
    }, [isSubmitting, onChange]);

    return null;
};

interface Props {
    schedule: Schedule;
    task?: Task;
    onSuccess: () => void;
    footer: (isSubmitting: boolean) => React.ReactNode;
    onSubmittingChange?: (isSubmitting: boolean) => void;
}

export default ({ schedule, task, onSuccess, footer, onSubmittingChange }: Props) => {
    const { clearFlashes, addError } = useFlash();

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const appendSchedule = ServerContext.useStoreActions((actions) => actions.schedules.appendSchedule);
    const backupLimit = ServerContext.useStoreState((state) => state.server.data!.featureLimits.backups);

    useEffect(
        () => () => {
            clearFlashes('automation:task');
        },
        [clearFlashes]
    );

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('automation:task');
        if (backupLimit === 0 && values.action === 'backup') {
            setSubmitting(false);
            addError({
                message: "A backup task cannot be created when the server's backup limit is set to 0.",
                key: 'automation:task',
            });
            return;
        }

        createOrUpdateScheduleTask(uuid, schedule.id, task?.id, {
            action: values.action,
            payload: values.payload,
            timeOffset: values.timeOffset,
            continueOnFailure: values.continueOnFailure,
            condition: values.condition || null,
        })
            .then((savedTask) => {
                let tasks = schedule.tasks.map((t) => (t.id === savedTask.id ? savedTask : t));
                if (!schedule.tasks.find((t) => t.id === savedTask.id)) {
                    tasks = [...tasks, savedTask];
                }

                appendSchedule({ ...schedule, tasks });
                onSuccess();
            })
            .catch((error) => {
                console.error(error);
                setSubmitting(false);
                addError({ message: httpErrorToHuman(error), key: 'automation:task' });
            });
    };

    return (
        <Formik
            onSubmit={submit}
            validationSchema={schema}
            initialValues={{
                action: task?.action || 'command',
                payload: task?.payload || '',
                timeOffset: task?.timeOffset.toString() || '0',
                continueOnFailure: task?.continueOnFailure || false,
                condition: task?.condition || '',
            }}
            enableReinitialize
        >
            {({ isSubmitting, values }) => (
                <Form css={tw`m-0 flex flex-col min-h-full`}>
                    {onSubmittingChange && <SubmittingBridge onChange={onSubmittingChange} />}
                    <div css={tw`flex-1 space-y-6`}>
                        <FlashMessageRender byKey={'automation:task'} />
                        <div css={tw`flex flex-col sm:flex-row gap-6`}>
                            <div css={tw`sm:w-1/3`}>
                                <Label>Action</Label>
                                <ActionListener />
                                <FormikFieldWrapper name={'action'}>
                                    <FormikField as={Select} name={'action'}>
                                        <option value={'command'}>Send command</option>
                                        <option value={'power'}>Send power action</option>
                                        <option value={'backup'}>Create backup</option>
                                        <option value={'webhook'}>Send webhook</option>
                                        <option value={'email'}>Send email</option>
                                        <option value={'delete_files'}>Delete files</option>
                                    </FormikField>
                                </FormikFieldWrapper>
                            </div>
                            <div css={tw`flex-1`}>
                                <Field
                                    name={'timeOffset'}
                                    label={'Time offset (in seconds)'}
                                    description={
                                        'The amount of time to wait after the previous task executes before running this one. If this is the first task in an automation this will not be applied.'
                                    }
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Condition</Label>
                            <FormikFieldWrapper
                                name={'condition'}
                                description={'Optional. Skip this task when the condition is not met.'}
                            >
                                <FormikField as={Select} name={'condition'}>
                                    <option value={''}>No condition</option>
                                    <option value={'require_online'}>Only when server is online</option>
                                    <option value={'require_backup_capacity'}>Only when backup capacity available</option>
                                </FormikField>
                            </FormikFieldWrapper>
                        </div>
                        <div>{renderPayload(values.action)}</div>
                        <div css={tw`bg-neutral-700 border border-neutral-800 shadow-inner p-4 rounded`}>
                            <FormikSwitch
                                name={'continueOnFailure'}
                                description={'Future tasks will be run when this task fails.'}
                                label={'Continue on Failure'}
                            />
                        </div>
                    </div>
                    <div css={tw`mt-6 pt-4 border-t border-realm-border`}>{footer(isSubmitting)}</div>
                </Form>
            )}
        </Formik>
    );
};
