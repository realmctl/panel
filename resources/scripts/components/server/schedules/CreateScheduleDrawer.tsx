import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { ChevronDownIcon } from '@heroicons/react/outline';
import Modal from '@/components/elements/Modal';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import FlashMessageRender from '@/components/FlashMessageRender';
import Can from '@/components/elements/Can';
import { Button } from '@/components/elements/button/index';
import Switch from '@/components/elements/Switch';
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
import { realmClasses } from '@/lib/realmTokens';

interface Props {
    visible: boolean;
    onDismissed: () => void;
}

const STEPS = ['Details', 'Schedule', 'Behavior', 'Review'] as const;

const CRON_FIELDS: { name: keyof CronFieldValues; label: string; hint: string }[] = [
    { name: 'minute', label: 'Minute', hint: '0–59' },
    { name: 'hour', label: 'Hour', hint: '0–23' },
    { name: 'dayOfMonth', label: 'Day', hint: '1–31' },
    { name: 'month', label: 'Month', hint: '1–12' },
    { name: 'dayOfWeek', label: 'Weekday', hint: 'MON–SUN' },
];

const DEFAULT_CRON: CronFieldValues = {
    minute: '*/5',
    hour: '*',
    dayOfMonth: '*',
    month: '*',
    dayOfWeek: '*',
};

const CreateScheduleDrawer = ({ visible, onDismissed }: Props) => {
    const { addError, clearFlashes } = useFlash();
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const appendSchedule = ServerContext.useStoreActions((actions) => actions.schedules.appendSchedule);

    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [showCheatsheet, setShowCheatsheet] = useState(false);
    const [name, setName] = useState('');
    const [nameError, setNameError] = useState('');
    const [cron, setCron] = useState<CronFieldValues>(DEFAULT_CRON);
    const [onlyWhenOnline, setOnlyWhenOnline] = useState(true);
    const [enabled, setEnabled] = useState(true);

    useEffect(() => {
        if (!visible) return;

        clearFlashes('automation:edit');
        setStep(0);
        setSaving(false);
        setShowCheatsheet(false);
        setName('');
        setNameError('');
        setCron(DEFAULT_CRON);
        setOnlyWhenOnline(true);
        setEnabled(true);
    }, [visible]);

    const handleDismiss = () => {
        if (saving) return;
        onDismissed();
    };

    const goNext = () => {
        if (step === 0 && !name.trim()) {
            setNameError('A name must be provided.');
            return;
        }
        setStep((current) => Math.min(current + 1, STEPS.length - 1));
    };

    const goBack = () => setStep((current) => Math.max(current - 1, 0));

    const setCronField = (field: keyof CronFieldValues, value: string) => setCron((prev) => ({ ...prev, [field]: value }));

    const save = () => {
        if (!name.trim()) {
            setNameError('A name must be provided.');
            setStep(0);
            return;
        }

        clearFlashes('automation:edit');
        setSaving(true);
        createOrUpdateSchedule(uuid, {
            name,
            cron: {
                minute: cron.minute,
                hour: cron.hour,
                dayOfWeek: cron.dayOfWeek,
                month: cron.month,
                dayOfMonth: cron.dayOfMonth,
            },
            onlyWhenOnline,
            isActive: enabled,
        })
            .then((schedule) => {
                appendSchedule(schedule);
                onDismissed();
            })
            .catch((error) => {
                console.error(error);
                addError({ key: 'automation:edit', message: httpErrorToHuman(error) });
            })
            .finally(() => setSaving(false));
    };

    const cronExpression = `${cron.minute} ${cron.hour} ${cron.dayOfMonth} ${cron.month} ${cron.dayOfWeek}`;

    return (
        <Modal
            visible={visible}
            onDismissed={handleDismiss}
            dismissable={!saving}
            closeOnBackground={!saving}
            closeOnEscape={!saving}
            wide
        >
            <div className={'relative flex h-[34rem] max-h-[80vh]'}>
                <SpinnerOverlay visible={saving} />

                <div className={'w-44 sm:w-52 flex-shrink-0 border-r border-realm-border/50 p-5'}>
                    <h2 className={'text-base font-semibold text-neutral-100 m-0 mb-1'}>Create Automation</h2>
                    <p className={'text-xs text-neutral-500 mb-4 font-mono truncate'}>{name || ' '}</p>
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

                        <FlashMessageRender byKey={'automation:edit'} className={'mb-4'} />

                        {step === 0 && (
                            <>
                                <h3 className={'text-xl font-semibold text-neutral-100 m-0 mb-1'}>Name this automation</h3>
                                <p className={'text-sm text-neutral-400 mb-5'}>
                                    Shown in the automation list and activity log.
                                </p>

                                <label className={'block text-xs uppercase tracking-wide text-neutral-400 mb-1.5'}>
                                    Name
                                </label>
                                <input
                                    className={classNames(
                                        'w-full rounded text-sm px-3 py-2 focus:outline-none transition-colors duration-150',
                                        realmClasses.input
                                    )}
                                    placeholder={'Daily restart'}
                                    value={name}
                                    autoFocus
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        setNameError('');
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            goNext();
                                        }
                                    }}
                                />
                                {nameError && <p className={'text-red-400 text-xs mt-1.5 mb-0'}>{nameError}</p>}
                            </>
                        )}

                        {step === 1 && (
                            <>
                                <h3 className={'text-xl font-semibold text-neutral-100 m-0 mb-1'}>Schedule</h3>
                                <p className={'text-sm text-neutral-400 mb-5'}>
                                    Choose a preset or fine-tune the cron fields. Tasks run when this schedule triggers.
                                </p>

                                <div className={'rounded-lg border border-realm-border bg-[#0b1014] px-4 py-3 mb-4'}>
                                    <p className={'text-2xs uppercase tracking-wide text-neutral-500 m-0 mb-1.5'}>
                                        Cron expression
                                    </p>
                                    <code className={'block font-mono text-sm text-blue-200 break-all'}>
                                        {cronExpression}
                                    </code>
                                    <p className={'text-xs text-neutral-500 mt-2 mb-0'}>{describeCronExpression(cron)}</p>
                                </div>

                                <div className={'flex flex-wrap gap-2 mb-4'}>
                                    {CRON_PRESETS.map((preset) => {
                                        const active = matchesCronPreset(cron, preset);

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
                                                onClick={() => setCron({ ...cron, ...preset.values })}
                                            >
                                                {preset.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className={'grid grid-cols-2 sm:grid-cols-5 gap-3'}>
                                    {CRON_FIELDS.map((field) => (
                                        <div key={field.name} className={'min-w-0'}>
                                            <label
                                                className={'block text-xs uppercase tracking-wide text-neutral-400 mb-1.5'}
                                            >
                                                {field.label}
                                            </label>
                                            <input
                                                className={classNames(
                                                    'w-full rounded text-sm px-3 py-2 focus:outline-none transition-colors duration-150 font-mono',
                                                    realmClasses.input
                                                )}
                                                spellCheck={false}
                                                value={cron[field.name]}
                                                onChange={(e) => setCronField(field.name, e.target.value)}
                                            />
                                            <p className={'text-xs text-neutral-500 mt-1 mb-0'}>{field.hint}</p>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type={'button'}
                                    className={
                                        'flex items-center gap-2 text-xs text-neutral-400 hover:text-neutral-200 transition-colors bg-transparent border-0 p-0 cursor-pointer mt-4'
                                    }
                                    onClick={() => setShowCheatsheet((value) => !value)}
                                >
                                    <ChevronDownIcon
                                        className={classNames(
                                            'w-4 h-4 transition-transform duration-150',
                                            showCheatsheet && 'rotate-180'
                                        )}
                                    />
                                    {showCheatsheet ? 'Hide cron reference' : 'Show cron reference'}
                                </button>
                                {showCheatsheet && <ScheduleCheatsheetCards compact />}
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <h3 className={'text-xl font-semibold text-neutral-100 m-0 mb-1'}>Behavior</h3>
                                <p className={'text-sm text-neutral-400 mb-5'}>
                                    Control when this automation is allowed to run.
                                </p>

                                <div
                                    className={classNames(
                                        'flex items-center justify-between p-4 rounded-lg mb-4',
                                        realmClasses.insetPanel
                                    )}
                                >
                                    <div>
                                        <p className={'text-sm font-medium text-neutral-200 m-0'}>
                                            Only when server is online
                                        </p>
                                        <p className={'text-xs text-neutral-500 mt-0.5 mb-0'}>
                                            Skip the run if the server is stopped or still starting.
                                        </p>
                                    </div>
                                    <Switch
                                        name={'only_when_online'}
                                        defaultChecked={onlyWhenOnline}
                                        onChange={(e) => setOnlyWhenOnline(e.target.checked)}
                                    />
                                </div>

                                <div
                                    className={classNames(
                                        'flex items-center justify-between p-4 rounded-lg',
                                        realmClasses.insetPanel
                                    )}
                                >
                                    <div>
                                        <p className={'text-sm font-medium text-neutral-200 m-0'}>Enabled</p>
                                        <p className={'text-xs text-neutral-500 mt-0.5 mb-0'}>
                                            Disabled automations stay saved but will not execute.
                                        </p>
                                    </div>
                                    <Switch
                                        name={'enabled'}
                                        defaultChecked={enabled}
                                        onChange={(e) => setEnabled(e.target.checked)}
                                    />
                                </div>
                            </>
                        )}

                        {step === 3 && (
                            <>
                                <h3 className={'text-xl font-semibold text-neutral-100 m-0 mb-1'}>Review Information</h3>
                                <p className={'text-sm text-neutral-400 mb-5'}>Make sure everything looks good!</p>

                                <div className={'rounded-md border border-realm-border/60 divide-y divide-realm-border/50'}>
                                    <div className={'flex items-center justify-between px-4 py-3'}>
                                        <span className={'text-sm text-neutral-500'}>Name</span>
                                        <span className={'text-sm text-neutral-200'}>{name}</span>
                                    </div>
                                    <div className={'flex items-center justify-between px-4 py-3'}>
                                        <span className={'text-sm text-neutral-500'}>Cron</span>
                                        <span className={'text-sm text-neutral-200 font-mono'}>{cronExpression}</span>
                                    </div>
                                    <div className={'flex items-center justify-between px-4 py-3'}>
                                        <span className={'text-sm text-neutral-500'}>Only when online</span>
                                        <span className={'text-sm text-neutral-200'}>
                                            {onlyWhenOnline ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                    <div className={'flex items-center justify-between px-4 py-3'}>
                                        <span className={'text-sm text-neutral-500'}>Enabled</span>
                                        <span className={'text-sm text-neutral-200'}>{enabled ? 'Yes' : 'No'}</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <Can action={'schedule.create'}>
                        <div className={'flex items-center justify-between gap-3 px-6 py-4 border-t border-realm-border/50'}>
                            <Button.Text
                                size={Button.Sizes.Small}
                                onClick={step === 0 ? handleDismiss : goBack}
                                disabled={saving}
                            >
                                {step === 0 ? 'Cancel' : 'Back'}
                            </Button.Text>

                            {step < STEPS.length - 1 ? (
                                <Button key={'nav-next'} size={Button.Sizes.Small} onClick={goNext}>
                                    Next Step
                                </Button>
                            ) : (
                                <Button key={'nav-save'} size={Button.Sizes.Small} disabled={saving} onClick={save}>
                                    {saving ? 'Creating…' : 'Create automation'}
                                </Button>
                            )}
                        </div>
                    </Can>
                </div>
            </div>
        </Modal>
    );
};

export default CreateScheduleDrawer;
