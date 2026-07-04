import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { Button } from '@/components/elements/button/index';
import Select from '@/components/elements/Select';
import Modal from '@/components/elements/Modal';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { ServerContext } from '@/state/server';
import { useFlashKey } from '@/plugins/useFlash';
import createSubdomain from '@/api/server/network/subdomains/createSubdomain';
import getSubdomains, { SubdomainTemplate } from '@/api/server/network/subdomains/getSubdomains';
import { realmClasses } from '@/lib/realmTokens';

const STEPS = ['Domain', 'Subdomain', 'Review'] as const;

interface Props {
    visible: boolean;
    templates: SubdomainTemplate[];
    onDismissed: () => void;
}

const CreateSubdomainDrawer = ({ visible, templates, onDismissed }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { clearFlashes, clearAndAddHttpError } = useFlashKey('server:network');
    const { mutate } = getSubdomains();

    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [domain, setDomain] = useState(() => templates[0]?.domain ?? '');
    const [template, setTemplate] = useState<SubdomainTemplate | null>(() => templates[0] ?? null);
    const [name, setName] = useState('');
    const [nameError, setNameError] = useState('');

    useEffect(() => {
        if (!visible) {
            return;
        }

        setStep(0);
        setSaving(false);
        setName('');
        setNameError('');

        if (templates.length > 0) {
            setTemplate(templates[0]);
            setDomain(templates[0].domain);
        }
    }, [visible, templates]);

    useEffect(() => {
        const filtered = templates.filter((item) => item.domain === domain);
        if (filtered.length > 0) {
            setTemplate(filtered[0]);
        }
    }, [domain, templates]);

    const validateName = (value: string): string => {
        if (!value) return 'A subdomain name must be provided.';
        if (value.length < 3) return 'Subdomain name must be at least 3 characters.';
        if (value.length > 48) return 'Subdomain name must not exceed 48 characters.';
        if (!/^[A-Za-z0-9]+$/.test(value)) return 'Subdomain name should only contain alphanumeric characters.';
        return '';
    };

    const handleDismiss = () => {
        if (saving) return;
        onDismissed();
    };

    const goNext = () => {
        if (step === 1) {
            const error = validateName(name);
            if (error) {
                setNameError(error);
                return;
            }
        }
        setStep((current) => Math.min(current + 1, STEPS.length - 1));
    };

    const goBack = () => setStep((current) => Math.max(current - 1, 0));

    const save = () => {
        const error = validateName(name);
        if (error) {
            setNameError(error);
            setStep(1);
            return;
        }

        if (!template) {
            clearAndAddHttpError(new Error('Template not found.'));
            return;
        }

        setSaving(true);
        clearFlashes();
        createSubdomain(uuid, template.id, name)
            .then(() => {
                mutate();
                onDismissed();
            })
            .catch((error) => clearAndAddHttpError(error))
            .finally(() => setSaving(false));
    };

    return (
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
                    <h2 className={'text-base font-semibold text-neutral-100 m-0 mb-1'}>New Subdomain</h2>
                    <p className={'text-xs text-neutral-500 mb-4 font-mono truncate'}>
                        {name && domain ? `${name}.${domain}` : domain || ' '}
                    </p>
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
                                <h3 className={'text-xl font-semibold text-neutral-100 m-0 mb-1'}>Choose Domain</h3>
                                <p className={'text-sm text-neutral-400 mb-5'}>
                                    Record template is picked automatically based on your server's egg.
                                </p>

                                <label className={'block text-xs uppercase tracking-wide text-neutral-400 mb-1.5'}>
                                    Domain
                                </label>
                                <Select
                                    onChange={(e) => setDomain(e.target.value)}
                                    value={domain}
                                    disabled={templates.length === 0}
                                    className={'h-12'}
                                >
                                    {[...new Set(templates.map((item) => item.domain))].map((item) => (
                                        <option key={item} value={item}>
                                            {item}
                                        </option>
                                    ))}
                                </Select>
                            </>
                        )}

                        {step === 1 && (
                            <>
                                <h3 className={'text-xl font-semibold text-neutral-100 m-0 mb-1'}>Subdomain Name</h3>
                                <p className={'text-sm text-neutral-400 mb-5'}>
                                    Choose the name to use in front of {domain || 'your domain'}.
                                </p>

                                <label className={'block text-xs uppercase tracking-wide text-neutral-400 mb-1.5'}>
                                    Name
                                </label>
                                <input
                                    className={classNames(
                                        'w-full rounded text-sm px-3 py-2 focus:outline-none transition-colors duration-150',
                                        realmClasses.input
                                    )}
                                    placeholder={'my-subdomain'}
                                    value={name}
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

                        {step === 2 && (
                            <>
                                <h3 className={'text-xl font-semibold text-neutral-100 m-0 mb-1'}>Review Information</h3>
                                <p className={'text-sm text-neutral-400 mb-5'}>Make sure everything looks good!</p>

                                <div className={'rounded-md border border-realm-border/60 divide-y divide-realm-border/50'}>
                                    <div className={'flex items-center justify-between px-4 py-3'}>
                                        <span className={'text-sm text-neutral-500'}>Hostname</span>
                                        <span className={'text-sm text-neutral-200 font-mono'}>
                                            {name}.{domain}
                                        </span>
                                    </div>
                                    <div className={'flex items-center justify-between px-4 py-3'}>
                                        <span className={'text-sm text-neutral-500'}>Template</span>
                                        <span className={'text-sm text-neutral-200'}>{template?.name ?? 'None'}</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className={'flex items-center justify-between gap-3 px-6 py-4 border-t border-realm-border/50'}>
                        <Button.Text size={Button.Sizes.Small} onClick={step === 0 ? handleDismiss : goBack} disabled={saving}>
                            {step === 0 ? 'Cancel' : 'Back'}
                        </Button.Text>

                        {step < STEPS.length - 1 ? (
                            <Button
                                key={'nav-next'}
                                size={Button.Sizes.Small}
                                onClick={goNext}
                                disabled={step === 0 && !template}
                            >
                                Next Step
                            </Button>
                        ) : (
                            <Button key={'nav-save'} size={Button.Sizes.Small} disabled={saving} onClick={save}>
                                {saving ? 'Creating…' : 'Create subdomain'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default CreateSubdomainDrawer;
