import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimes, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/elements/button/index';
import Switch from '@/components/elements/Switch';
import Select from '@/components/elements/Select';
import Modal from '@/components/elements/Modal';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { Allocation, AllocationProtocol } from '@/api/server/getServer';
import setAllocationWhitelist from '@/api/server/network/setAllocationWhitelist';
import { useFlashKey } from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';
import getServerAllocations from '@/api/swr/getServerAllocations';
import { realmClasses } from '@/lib/realmTokens';
import { ip } from '@/lib/formatters';

const IpTag = styled.span`
    ${tw`inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-md mr-1.5 mb-1.5`};
    background-color: #0e1417;
    border: 1px solid #2d3338;
    color: #94a3b8;
`;

const PROTOCOL_LABEL: Record<AllocationProtocol, string> = {
    tcp: 'TCP',
    udp: 'UDP',
    both: 'TCP + UDP',
};

const STEPS = ['Whitelist', 'Allowed IPs', 'Review'] as const;

interface Props {
    visible: boolean;
    allocation: Allocation;
    onDismissed: () => void;
}

const AllocationFirewallModal = ({ visible, allocation, onDismissed }: Props) => {
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [enabled, setEnabled] = useState(allocation.whitelistEnabled);
    const [protocol, setProtocol] = useState<AllocationProtocol>(allocation.protocol);
    const [allowedIps, setAllowedIps] = useState<string[]>(allocation.allowedIps);
    const [ipInput, setIpInput] = useState('');
    const [ipError, setIpError] = useState('');

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { mutate } = getServerAllocations();
    const { clearFlashes, clearAndAddHttpError } = useFlashKey('server:network');

    const address = `${allocation.alias ?? ip(allocation.ip)}:${allocation.port}`;

    useEffect(() => {
        if (!visible) {
            return;
        }

        setStep(0);
        setEnabled(allocation.whitelistEnabled);
        setProtocol(allocation.protocol);
        setAllowedIps(allocation.allowedIps);
        setIpInput('');
        setIpError('');
        setSaving(false);
    }, [visible, allocation]);

    const ipv4Cidr = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;

    const addIp = () => {
        const trimmed = ipInput.trim();
        if (!trimmed) return;
        if (!ipv4Cidr.test(trimmed)) {
            setIpError('Enter a valid IPv4 address or CIDR range (e.g. 192.168.1.1 or 10.0.0.0/24).');
            return;
        }
        if (allowedIps.includes(trimmed)) {
            setIpError('This address is already in the list.');
            return;
        }
        setIpError('');
        setAllowedIps((prev) => [...prev, trimmed]);
        setIpInput('');
    };

    const removeIp = (value: string) => setAllowedIps((prev) => prev.filter((entry) => entry !== value));

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addIp();
        }
    };

    const handleDismiss = () => {
        if (saving) return;
        onDismissed();
    };

    const goNext = () => {
        if (step === 1 && enabled && allowedIps.length === 0) {
            setIpError('Add at least one IP address before enabling the whitelist.');
            return;
        }
        setStep((current) => Math.min(current + 1, STEPS.length - 1));
    };

    const goBack = () => setStep((current) => Math.max(current - 1, 0));

    const save = () => {
        if (enabled && allowedIps.length === 0) {
            setIpError('Add at least one IP address before enabling the whitelist.');
            setStep(1);
            return;
        }

        setSaving(true);
        clearFlashes();
        setAllocationWhitelist(uuid, allocation.id, { whitelistEnabled: enabled, protocol, allowedIps })
            .then((updated) => {
                mutate((data) => data?.map((a) => (a.id === updated.id ? updated : a)), false);
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
            <div className={'relative flex h-[32rem] max-h-[80vh]'}>
                <SpinnerOverlay visible={saving} />

                <div className={'w-44 sm:w-52 flex-shrink-0 border-r border-realm-border/50 p-5'}>
                    <h2 className={'text-base font-semibold text-neutral-100 m-0 mb-1'}>Firewall</h2>
                    <p className={'text-xs text-neutral-500 mb-4 font-mono truncate'}>{address}</p>
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
                                <h3 className={'text-xl font-semibold text-neutral-100 m-0 mb-1'}>Enable Whitelist</h3>
                                <p className={'text-sm text-neutral-400 mb-5'}>
                                    Restrict connections to this port to listed IPs only.
                                </p>

                                <div
                                    className={classNames(
                                        'flex items-center justify-between p-4 rounded-lg mb-4',
                                        realmClasses.insetPanel
                                    )}
                                >
                                    <div>
                                        <p className={'text-sm font-medium text-neutral-200 m-0'}>Enable Whitelist</p>
                                        <p className={'text-xs text-neutral-500 mt-0.5 mb-0'}>
                                            When disabled, all connections are allowed.
                                        </p>
                                    </div>
                                    <Switch
                                        key={`${allocation.id}-${visible}`}
                                        name={`whitelist_enabled_${allocation.id}`}
                                        defaultChecked={enabled}
                                        onChange={(e) => setEnabled(e.target.checked)}
                                    />
                                </div>

                                <label className={'block text-xs uppercase tracking-wide text-neutral-400 mb-1.5'}>
                                    Protocol
                                </label>
                                <Select
                                    value={protocol}
                                    onChange={(e) => setProtocol(e.target.value as AllocationProtocol)}
                                    disabled={!enabled}
                                >
                                    <option value={'tcp'}>TCP</option>
                                    <option value={'udp'}>UDP</option>
                                    <option value={'both'}>TCP + UDP</option>
                                </Select>
                            </>
                        )}

                        {step === 1 && (
                            <>
                                <h3 className={'text-xl font-semibold text-neutral-100 m-0 mb-1'}>Allowed IPs</h3>
                                <p className={'text-sm text-neutral-400 mb-5'}>
                                    Only these IPs and CIDR ranges will be able to connect{enabled ? '' : ' once enabled'}.
                                </p>

                                <div className={'flex gap-2'}>
                                    <input
                                        className={classNames(
                                            'flex-1 rounded text-sm px-3 py-2 focus:outline-none transition-colors duration-150',
                                            realmClasses.input
                                        )}
                                        placeholder={'192.168.1.1 or 10.0.0.0/24'}
                                        value={ipInput}
                                        onChange={(e) => {
                                            setIpInput(e.target.value);
                                            setIpError('');
                                        }}
                                        onKeyDown={handleKeyDown}
                                    />
                                    <Button
                                        type={'button'}
                                        size={Button.Sizes.Small}
                                        disabled={!ipInput.trim()}
                                        onClick={addIp}
                                        className={'flex items-center gap-1.5 whitespace-nowrap'}
                                    >
                                        <FontAwesomeIcon icon={faPlus} className={'text-xs'} />
                                        Add
                                    </Button>
                                </div>
                                {ipError && <p className={'text-red-400 text-xs mt-1.5 mb-0'}>{ipError}</p>}

                                <div className={'mt-4'}>
                                    {allowedIps.length > 0 ? (
                                        <div className={classNames('p-3 rounded-lg flex flex-wrap', realmClasses.insetPanel)}>
                                            {allowedIps.map((entry) => (
                                                <IpTag key={entry}>
                                                    {entry}
                                                    <button
                                                        type={'button'}
                                                        className={
                                                            'text-neutral-600 hover:text-red-400 transition-colors duration-150 ml-0.5 border-0 bg-transparent p-0 cursor-pointer'
                                                        }
                                                        onClick={() => removeIp(entry)}
                                                    >
                                                        <FontAwesomeIcon icon={faTimes} />
                                                    </button>
                                                </IpTag>
                                            ))}
                                        </div>
                                    ) : (
                                        <div
                                            className={classNames(
                                                'flex items-center gap-2 p-3 rounded-lg text-xs text-neutral-500',
                                                realmClasses.insetPanel
                                            )}
                                        >
                                            <FontAwesomeIcon icon={faInfoCircle} />
                                            No IPs added yet.
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <h3 className={'text-xl font-semibold text-neutral-100 m-0 mb-1'}>Review Information</h3>
                                <p className={'text-sm text-neutral-400 mb-5'}>Make sure everything looks good!</p>

                                <div className={'rounded-md border border-realm-border/60 divide-y divide-realm-border/50'}>
                                    <div className={'flex items-center justify-between px-4 py-3'}>
                                        <span className={'text-sm text-neutral-500'}>Whitelist</span>
                                        <span className={'text-sm text-neutral-200'}>{enabled ? 'Enabled' : 'Disabled'}</span>
                                    </div>
                                    <div className={'flex items-center justify-between px-4 py-3'}>
                                        <span className={'text-sm text-neutral-500'}>Protocol</span>
                                        <span className={'text-sm text-neutral-200'}>{PROTOCOL_LABEL[protocol]}</span>
                                    </div>
                                    <div className={'flex items-start justify-between gap-4 px-4 py-3'}>
                                        <span className={'text-sm text-neutral-500 flex-shrink-0'}>Allowed IPs</span>
                                        <span className={'text-sm text-neutral-200 text-right'}>
                                            {allowedIps.length > 0 ? allowedIps.join(', ') : 'None'}
                                        </span>
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
                            <Button key={'nav-next'} size={Button.Sizes.Small} onClick={goNext}>
                                Next Step
                            </Button>
                        ) : (
                            <Button key={'nav-save'} size={Button.Sizes.Small} disabled={saving} onClick={save}>
                                {saving ? 'Saving…' : 'Save'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default AllocationFirewallModal;
