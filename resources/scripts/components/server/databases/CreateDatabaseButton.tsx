import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import Modal from '@/components/elements/Modal';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { Button } from '@/components/elements/button/index';
import createServerDatabase from '@/api/server/databases/createServerDatabase';
import { ServerContext } from '@/state/server';
import { httpErrorToHuman } from '@/api/http';
import useFlash from '@/plugins/useFlash';
import { realmClasses } from '@/lib/realmTokens';

const STEPS = ['Database', 'Access', 'Review'] as const;

const NAME_REGEX = /^[\w\-.]{3,48}$/;
const HOST_REGEX = /^[\w\-/.%:]+$/;

interface Props {
    trigger?: (open: () => void) => React.ReactNode;
}

export default ({ trigger }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { addError, clearFlashes } = useFlash();
    const appendDatabase = ServerContext.useStoreActions((actions) => actions.databases.appendDatabase);

    const [visible, setVisible] = useState(false);
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [databaseName, setDatabaseName] = useState('');
    const [connectionsFrom, setConnectionsFrom] = useState('');
    const [nameError, setNameError] = useState('');
    const [hostError, setHostError] = useState('');

    useEffect(() => {
        if (!visible) {
            return;
        }

        setStep(0);
        setSaving(false);
        setDatabaseName('');
        setConnectionsFrom('');
        setNameError('');
        setHostError('');
    }, [visible]);

    const validateName = (value: string): string => {
        if (!value) return 'A database name must be provided.';
        if (value.length < 3) return 'Database name must be at least 3 characters.';
        if (value.length > 48) return 'Database name must not exceed 48 characters.';
        if (!NAME_REGEX.test(value)) {
            return 'Database name should only contain alphanumeric characters, underscores, dashes, and/or periods.';
        }
        return '';
    };

    const validateHost = (value: string): string => {
        if (value && !HOST_REGEX.test(value)) return 'A valid host address must be provided.';
        return '';
    };

    const handleDismiss = () => {
        if (saving) return;
        setVisible(false);
    };

    const goNext = () => {
        if (step === 0) {
            const error = validateName(databaseName);
            if (error) {
                setNameError(error);
                return;
            }
        }

        if (step === 1) {
            const error = validateHost(connectionsFrom);
            if (error) {
                setHostError(error);
                return;
            }
        }

        setStep((current) => Math.min(current + 1, STEPS.length - 1));
    };

    const goBack = () => setStep((current) => Math.max(current - 1, 0));

    const save = () => {
        const nameErr = validateName(databaseName);
        if (nameErr) {
            setNameError(nameErr);
            setStep(0);
            return;
        }

        const hostErr = validateHost(connectionsFrom);
        if (hostErr) {
            setHostError(hostErr);
            setStep(1);
            return;
        }

        clearFlashes('database:create');
        setSaving(true);
        createServerDatabase(uuid, {
            databaseName,
            connectionsFrom: connectionsFrom || '%',
        })
            .then((database) => {
                appendDatabase(database);
                setVisible(false);
            })
            .catch((error) => {
                addError({ key: 'database:create', message: httpErrorToHuman(error) });
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
                <div className={'relative flex h-[28rem] max-h-[80vh]'}>
                    <SpinnerOverlay visible={saving} />

                    <div className={'w-44 sm:w-52 flex-shrink-0 border-r border-realm-border/50 p-5'}>
                        <h2 className={'text-base font-semibold text-neutral-100 m-0 mb-1'}>New Database</h2>
                        <p className={'text-xs text-neutral-500 mb-4 font-mono truncate'}>{databaseName || ' '}</p>
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

                            {step === 0 && (
                                <>
                                    <h3 className={'text-xl font-semibold text-neutral-100 m-0 mb-1'}>Database Name</h3>
                                    <p className={'text-sm text-neutral-400 mb-5'}>
                                        A descriptive name for your database instance.
                                    </p>

                                    <label className={'block text-xs uppercase tracking-wide text-neutral-400 mb-1.5'}>
                                        Name
                                    </label>
                                    <input
                                        className={classNames(
                                            'w-full rounded text-sm px-3 py-2 focus:outline-none transition-colors duration-150',
                                            realmClasses.input
                                        )}
                                        placeholder={'s1_database'}
                                        value={databaseName}
                                        onChange={(e) => {
                                            setDatabaseName(e.target.value);
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
                                    <h3 className={'text-xl font-semibold text-neutral-100 m-0 mb-1'}>Connections From</h3>
                                    <p className={'text-sm text-neutral-400 mb-5'}>
                                        Where connections should be allowed from. Leave blank to allow connections from
                                        anywhere.
                                    </p>

                                    <label className={'block text-xs uppercase tracking-wide text-neutral-400 mb-1.5'}>
                                        Connections From
                                    </label>
                                    <input
                                        className={classNames(
                                            'w-full rounded text-sm px-3 py-2 focus:outline-none transition-colors duration-150',
                                            realmClasses.input
                                        )}
                                        placeholder={'%'}
                                        value={connectionsFrom}
                                        onChange={(e) => {
                                            setConnectionsFrom(e.target.value);
                                            setHostError('');
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                goNext();
                                            }
                                        }}
                                    />
                                    {hostError && <p className={'text-red-400 text-xs mt-1.5 mb-0'}>{hostError}</p>}
                                </>
                            )}

                            {step === 2 && (
                                <>
                                    <h3 className={'text-xl font-semibold text-neutral-100 m-0 mb-1'}>Review Information</h3>
                                    <p className={'text-sm text-neutral-400 mb-5'}>Make sure everything looks good!</p>

                                    <div className={'rounded-md border border-realm-border/60 divide-y divide-realm-border/50'}>
                                        <div className={'flex items-center justify-between px-4 py-3'}>
                                            <span className={'text-sm text-neutral-500'}>Database Name</span>
                                            <span className={'text-sm text-neutral-200 font-mono'}>{databaseName}</span>
                                        </div>
                                        <div className={'flex items-center justify-between px-4 py-3'}>
                                            <span className={'text-sm text-neutral-500'}>Connections From</span>
                                            <span className={'text-sm text-neutral-200 font-mono'}>
                                                {connectionsFrom || '%'}
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
                                    {saving ? 'Creating…' : 'Create Database'}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>
            {trigger ? trigger(() => setVisible(true)) : <Button onClick={() => setVisible(true)}>New Database</Button>}
        </>
    );
};
