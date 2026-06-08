import React, { useEffect, useState } from 'react';
import { Form, Formik, FormikHelpers, useFormikContext } from 'formik';
import classNames from 'classnames';
import { ChevronDownIcon } from '@heroicons/react/outline';
import tw from 'twin.macro';
import Drawer from '@/components/elements/Drawer';
import FlashMessageRender from '@/components/FlashMessageRender';
import Can from '@/components/elements/Can';
import { Button } from '@/components/elements/button/index';
import Field from '@/components/elements/Field';
import FormikSwitch from '@/components/elements/FormikSwitch';
import ScheduleCheatsheetCards from '@/components/server/schedules/ScheduleCheatsheetCards';
import {
    CRON_PRESETS,
    CronFieldValues,
    describeCronExpression,
    matchesCronPreset,
} from '@/components/server/schedules/scheduleCronPresets';
import createOrUpdateSchedule from '@/api/server/schedules/createOrUpdateSchedule';
import { ServerContext } from '@/state/server';
import { httpErrorToHuman } from '@/api/http';
import useFlash from '@/plugins/useFlash';

interface Values extends CronFieldValues {
    name: string;
    enabled: boolean;
    onlyWhenOnline: boolean;
}

interface Props {
    visible: boolean;
    onDismissed: () => void;
}

const CRON_FIELDS: { name: keyof CronFieldValues; label: string; hint: string }[] = [
    { name: 'minute', label: 'Minute', hint: '0–59' },
    { name: 'hour', label: 'Hour', hint: '0–23' },
    { name: 'dayOfMonth', label: 'Day', hint: '1–31' },
    { name: 'month', label: 'Month', hint: '1–12' },
    { name: 'dayOfWeek', label: 'Weekday', hint: 'MON–SUN' },
];

const Section = ({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
}) => (
    <section className={'space-y-3'}>
        <div>
            <h3 className={'text-sm font-semibold text-neutral-100 m-0'}>{title}</h3>
            {description && <p className={'text-xs text-neutral-500 mt-1 mb-0'}>{description}</p>}
        </div>
        {children}
    </section>
);

const CronPreview = () => {
    const { values } = useFormikContext<Values>();
    const expression = `${values.minute} ${values.hour} ${values.dayOfMonth} ${values.month} ${values.dayOfWeek}`;

    return (
        <div className={'rounded-lg border border-realm-border bg-[#0b1014] px-4 py-3'}>
            <p className={'text-2xs uppercase tracking-wide text-neutral-500 m-0 mb-1.5'}>Cron expression</p>
            <code className={'block font-mono text-sm text-blue-200 break-all'}>{expression}</code>
            <p className={'text-xs text-neutral-500 mt-2 mb-0'}>{describeCronExpression(values)}</p>
        </div>
    );
};

const CronPresetPicker = () => {
    const { values, setValues } = useFormikContext<Values>();

    return (
        <div className={'flex flex-wrap gap-2'}>
            {CRON_PRESETS.map((preset) => {
                const active = matchesCronPreset(values, preset);

                return (
                    <button
                        key={preset.id}
                        type={'button'}
                        title={preset.description}
                        className={classNames(
                            'px-3 py-1.5 text-xs font-medium rounded-md border transition-colors duration-150 cursor-pointer',
                            active
                                ? 'border-blue-500/50 bg-blue-500/15 text-blue-200'
                                : 'border-realm-border/70 bg-realm-surface/40 text-neutral-300 hover:border-neutral-500 hover:bg-neutral-800/40'
                        )}
                        onClick={() =>
                            setValues({
                                ...values,
                                ...preset.values,
                            })
                        }
                    >
                        {preset.label}
                    </button>
                );
            })}
        </div>
    );
};

const CronFieldGrid = () => (
    <div className={'grid grid-cols-2 sm:grid-cols-5 gap-3'}>
        {CRON_FIELDS.map((field) => (
            <div key={field.name} className={'min-w-0'}>
                <Field
                    name={field.name}
                    label={field.label}
                    description={field.hint}
                    className={'font-mono text-sm'}
                    spellCheck={false}
                />
            </div>
        ))}
    </div>
);

const CreateScheduleForm = ({
    isSubmitting,
    showCheatsheet,
    onToggleCheatsheet,
    onCancel,
}: {
    isSubmitting: boolean;
    showCheatsheet: boolean;
    onToggleCheatsheet: () => void;
    onCancel: () => void;
}) => (
    <Form css={tw`flex flex-col min-h-full m-0`}>
        <div css={tw`space-y-6 flex-1`}>
            <FlashMessageRender byKey={'automation:edit'} />

            <Section title={'Details'} description={'Give this automation a clear name so you can find it later.'}>
                <Field
                    name={'name'}
                    label={'Name'}
                    description={'Shown in the automation list and activity log.'}
                    placeholder={'Daily restart'}
                    autoFocus
                />
            </Section>

            <Section
                title={'Schedule'}
                description={'Choose a preset or fine-tune the cron fields. Tasks run when this schedule triggers.'}
            >
                <CronPreview />
                <CronPresetPicker />
                <CronFieldGrid />
                <button
                    type={'button'}
                    className={
                        'flex items-center gap-2 text-xs text-neutral-400 hover:text-neutral-200 transition-colors bg-transparent border-0 p-0 cursor-pointer'
                    }
                    onClick={onToggleCheatsheet}
                >
                    <ChevronDownIcon
                        className={classNames('w-4 h-4 transition-transform duration-150', showCheatsheet && 'rotate-180')}
                    />
                    {showCheatsheet ? 'Hide cron reference' : 'Show cron reference'}
                </button>
                {showCheatsheet && <ScheduleCheatsheetCards compact />}
            </Section>

            <Section title={'Behavior'} description={'Control when this automation is allowed to run.'}>
                <div className={'rounded-lg border border-realm-border divide-y divide-realm-border/60 overflow-hidden'}>
                    <div className={'px-4 py-3 bg-realm-surface/30'}>
                        <FormikSwitch
                            name={'onlyWhenOnline'}
                            description={'Skip the run if the server is stopped or still starting.'}
                            label={'Only when server is online'}
                        />
                    </div>
                    <div className={'px-4 py-3 bg-realm-surface/30'}>
                        <FormikSwitch
                            name={'enabled'}
                            description={'Disabled automations stay saved but will not execute.'}
                            label={'Enabled'}
                        />
                    </div>
                </div>
            </Section>
        </div>

        <Can action={'schedule.create'}>
            <div css={tw`mt-6 pt-4 border-t border-realm-border flex justify-end gap-3`}>
                <Button.Text size={Button.Sizes.Small} type={'button'} onClick={onCancel} disabled={isSubmitting}>
                    Cancel
                </Button.Text>
                <Button size={Button.Sizes.Small} type={'submit'} disabled={isSubmitting}>
                    {isSubmitting ? 'Creating…' : 'Create automation'}
                </Button>
            </div>
        </Can>
    </Form>
);

const CreateScheduleDrawer = ({ visible, onDismissed }: Props) => {
    const { addError, clearFlashes } = useFlash();
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const appendSchedule = ServerContext.useStoreActions((actions) => actions.schedules.appendSchedule);
    const [showCheatsheet, setShowCheatsheet] = useState(false);

    useEffect(
        () => () => {
            clearFlashes('automation:edit');
        },
        [clearFlashes]
    );

    const handleDismiss = () => {
        clearFlashes('automation:edit');
        setShowCheatsheet(false);
        onDismissed();
    };

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('automation:edit');
        createOrUpdateSchedule(uuid, {
            name: values.name,
            cron: {
                minute: values.minute,
                hour: values.hour,
                dayOfWeek: values.dayOfWeek,
                month: values.month,
                dayOfMonth: values.dayOfMonth,
            },
            onlyWhenOnline: values.onlyWhenOnline,
            isActive: values.enabled,
        })
            .then((schedule) => {
                appendSchedule(schedule);
                setSubmitting(false);
                handleDismiss();
            })
            .catch((error) => {
                console.error(error);
                setSubmitting(false);
                addError({ key: 'automation:edit', message: httpErrorToHuman(error) });
            });
    };

    return (
        <Formik
            onSubmit={submit}
            initialValues={
                {
                    name: '',
                    minute: '*/5',
                    hour: '*',
                    dayOfMonth: '*',
                    month: '*',
                    dayOfWeek: '*',
                    enabled: true,
                    onlyWhenOnline: true,
                } as Values
            }
            enableReinitialize
        >
            {({ isSubmitting, resetForm }) => (
                <Drawer
                    visible={visible}
                    onDismissed={() => {
                        resetForm();
                        handleDismiss();
                    }}
                    title={'Create automation'}
                    subtitle={'Set a schedule first — you can add tasks after creating it.'}
                    width={'42rem'}
                    dismissable={!isSubmitting}
                    closeOnBackground={!isSubmitting}
                    closeOnEscape={!isSubmitting}
                >
                    <CreateScheduleForm
                        isSubmitting={isSubmitting}
                        showCheatsheet={showCheatsheet}
                        onToggleCheatsheet={() => setShowCheatsheet((value) => !value)}
                        onCancel={handleDismiss}
                    />
                </Drawer>
            )}
        </Formik>
    );
};

export default CreateScheduleDrawer;
