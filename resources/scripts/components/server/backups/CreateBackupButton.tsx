import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import Modal from '@/components/elements/Modal';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import Switch from '@/components/elements/Switch';
import { Textarea } from '@/components/elements/Input';
import { Button } from '@/components/elements/button/index';
import Can from '@/components/elements/Can';
import FlashMessageRender from '@/components/FlashMessageRender';
import useFlash from '@/plugins/useFlash';
import createServerBackup from '@/api/server/backups/createServerBackup';
import getServerBackups from '@/api/swr/getServerBackups';
import { ServerContext } from '@/state/server';
import { realmClasses } from '@/lib/realmTokens';

const STEPS = ['Details', 'Ignored Files', 'Review'] as const;

interface Props {
    visible?: boolean;
    onDismissed?: () => void;
    hideTrigger?: boolean;
}

export default ({ visible: controlledVisible, onDismissed, hideTrigger }: Props = {}) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { mutate } = getServerBackups();

    const [uncontrolledVisible, setUncontrolledVisible] = useState(false);
    const visible = controlledVisible ?? uncontrolledVisible;
    const setVisible = (value: boolean) => {
        if (!value) onDismissed?.();
        setUncontrolledVisible(value);
    };
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState('');
    const [ignored, setIgnored] = useState('');
    const [isLocked, setIsLocked] = useState(false);

    useEffect(() => {
        if (!visible) return;

        clearFlashes('backups:create');
        setStep(0);
        setSaving(false);
        setName('');
        setIgnored('');
        setIsLocked(false);
    }, [visible]);

    const handleDismiss = () => {
        if (saving) return;
        setVisible(false);
    };

    const goNext = () => setStep((current) => Math.min(current + 1, STEPS.length - 1));
    const goBack = () => setStep((current) => Math.max(current - 1, 0));

    const save = () => {
        clearFlashes('backups:create');
        setSaving(true);
        createServerBackup(uuid, { name, ignored, isLocked })
            .then((backup) => {
                mutate(
                    (data) => ({ ...data, items: data.items.concat(backup), backupCount: data.backupCount + 1 }),
                    false
                );
                setVisible(false);
            })
            .catch((error) => {
                clearAndAddHttpError({ key: 'backups:create', error });
            })
            .finally(() => setSaving(false));
    };

    return (
        <>
            <Modal
                visible={visible}
                onDismissed={handleDismiss}
                dismissable={!saving}
                closeOnBackground={!saving}
                closeOnEscape={!saving}
                wide
            >
                <div className={'relative flex h-[30rem] max-h-[80vh]'}>
                    <SpinnerOverlay visible={saving} />

                    <div className={'w-44 sm:w-52 flex-shrink-0 border-r border-realm-border/50 p-5'}>
                        <h2 className={'text-base font-semibold text-neutral-100 m-0 mb-1'}>Create Backup</h2>
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

                            <FlashMessageRender byKey={'backups:create'} className={'mb-4'} />

                            {step === 0 && (
                                <>
                                    <h3 className={'text-xl font-semibold text-neutral-100 m-0 mb-1'}>Backup Details</h3>
                                    <p className={'text-sm text-neutral-400 mb-5'}>
                                        Give this backup a name and choose whether it should be locked.
                                    </p>

                                    <label className={'block text-xs uppercase tracking-wide text-neutral-400 mb-1.5'}>
                                        Backup Name
                                    </label>
                                    <input
                                        className={classNames(
                                            'w-full rounded text-sm px-3 py-2 focus:outline-none transition-colors duration-150',
                                            realmClasses.input
                                        )}
                                        placeholder={'If left blank, a name will be generated automatically.'}
                                        value={name}
                                        maxLength={191}
                                        onChange={(e) => setName(e.target.value)}
                                    />

                                    <Can action={'backup.delete'}>
                                        <div
                                            className={classNames(
                                                'flex items-center justify-between p-4 rounded-lg mt-5',
                                                realmClasses.insetPanel
                                            )}
                                        >
                                            <div>
                                                <p className={'text-sm font-medium text-neutral-200 m-0'}>Locked</p>
                                                <p className={'text-xs text-neutral-500 mt-0.5 mb-0'}>
                                                    Prevents this backup from being deleted until explicitly unlocked.
                                                </p>
                                            </div>
                                            <Switch
                                                name={'is_locked'}
                                                defaultChecked={isLocked}
                                                onChange={(e) => setIsLocked(e.target.checked)}
                                            />
                                        </div>
                                    </Can>
                                </>
                            )}

                            {step === 1 && (
                                <>
                                    <h3 className={'text-xl font-semibold text-neutral-100 m-0 mb-1'}>
                                        Ignored Files & Directories
                                    </h3>
                                    <p className={'text-sm text-neutral-400 mb-5'}>
                                        Enter the files or folders to ignore while generating this backup. Leave blank to
                                        use the contents of the .realmignore file in the root of the server directory if
                                        present. Wildcard matching is supported, and rules can be negated by prefixing
                                        the path with an exclamation point.
                                    </p>

                                    <Textarea
                                        value={ignored}
                                        rows={8}
                                        onChange={(e) => setIgnored(e.target.value)}
                                    />
                                </>
                            )}

                            {step === 2 && (
                                <>
                                    <h3 className={'text-xl font-semibold text-neutral-100 m-0 mb-1'}>Review Information</h3>
                                    <p className={'text-sm text-neutral-400 mb-5'}>Make sure everything looks good!</p>

                                    <div className={'rounded-md border border-realm-border/60 divide-y divide-realm-border/50'}>
                                        <div className={'flex items-center justify-between px-4 py-3'}>
                                            <span className={'text-sm text-neutral-500'}>Backup Name</span>
                                            <span className={'text-sm text-neutral-200 font-mono'}>
                                                {name || 'Automatically generated'}
                                            </span>
                                        </div>
                                        <div className={'flex items-center justify-between px-4 py-3'}>
                                            <span className={'text-sm text-neutral-500'}>Locked</span>
                                            <span className={'text-sm text-neutral-200'}>{isLocked ? 'Yes' : 'No'}</span>
                                        </div>
                                        <div className={'flex items-start justify-between gap-4 px-4 py-3'}>
                                            <span className={'text-sm text-neutral-500 flex-shrink-0'}>Ignored Files</span>
                                            <span className={'text-sm text-neutral-200 text-right whitespace-pre-wrap'}>
                                                {ignored || 'None'}
                                            </span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

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
                                    {saving ? 'Starting…' : 'Start Backup'}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>
            {!hideTrigger && (
                <Button className={'w-full sm:w-auto'} onClick={() => setVisible(true)}>
                    Create backup
                </Button>
            )}
        </>
    );
};
