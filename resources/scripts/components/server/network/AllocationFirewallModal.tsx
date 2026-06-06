import React, { useEffect, useState } from 'react';
import { Button } from '@/components/elements/button/index';
import Switch from '@/components/elements/Switch';
import Select from '@/components/elements/Select';
import Drawer from '@/components/elements/Drawer';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { Allocation, AllocationProtocol } from '@/api/server/getServer';
import setAllocationWhitelist from '@/api/server/network/setAllocationWhitelist';
import { useFlashKey } from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';
import getServerAllocations from '@/api/swr/getServerAllocations';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimes, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import classNames from 'classnames';
import { realmClasses } from '@/lib/realmTokens';
import { ip } from '@/lib/formatters';

const IpTag = styled.span`
    ${tw`inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-md mr-1.5 mb-1.5`};
    background-color: #0e1417;
    border: 1px solid #2d3338;
    color: #94a3b8;
`;

interface Props {
    visible: boolean;
    allocation: Allocation;
    onDismissed: () => void;
}

const AllocationFirewallModal = ({ visible, allocation, onDismissed }: Props) => {
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
        if (saving) {
            return;
        }

        onDismissed();
    };

    const save = () => {
        if (enabled && allowedIps.length === 0) {
            setIpError('Add at least one IP address before enabling the whitelist.');
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
        <Drawer
            visible={visible}
            onDismissed={handleDismiss}
            title={'IP Whitelist'}
            subtitle={address}
            width={'28rem'}
            dismissable={!saving}
            closeOnBackground={!saving}
            closeOnEscape={!saving}
        >
            <div className={'relative flex flex-col min-h-full'}>
                <SpinnerOverlay visible={saving} />

                <div css={tw`space-y-4 flex-1`}>
                    <div
                        className={classNames(
                            'flex items-center justify-between p-4 rounded-lg',
                            realmClasses.insetPanel
                        )}
                    >
                        <div>
                            <p className={'text-sm font-medium text-neutral-200 m-0'}>Enable Whitelist</p>
                            <p className={'text-xs text-neutral-500 mt-0.5 mb-0'}>
                                Restrict connections to this port to listed IPs only.
                            </p>
                        </div>
                        <Switch
                            key={`${allocation.id}-${visible}`}
                            name={`whitelist_enabled_${allocation.id}`}
                            defaultChecked={enabled}
                            onChange={(e) => setEnabled(e.target.checked)}
                        />
                    </div>

                    <div>
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
                    </div>

                    <div>
                        <label className={'block text-xs uppercase tracking-wide text-neutral-400 mb-1.5'}>
                            Allowed IPs &amp; CIDR Ranges
                        </label>
                        <div className={'flex gap-2'}>
                            <input
                                className={classNames(
                                    'flex-1 rounded text-sm px-3 py-2 focus:outline-none transition-colors duration-150',
                                    realmClasses.input
                                )}
                                placeholder={'192.168.1.1 or 10.0.0.0/24'}
                                value={ipInput}
                                disabled={!enabled}
                                onChange={(e) => {
                                    setIpInput(e.target.value);
                                    setIpError('');
                                }}
                                onKeyDown={handleKeyDown}
                            />
                            <Button
                                type={'button'}
                                size={Button.Sizes.Small}
                                disabled={!enabled || !ipInput.trim()}
                                onClick={addIp}
                                className={'flex items-center gap-1.5 whitespace-nowrap'}
                            >
                                <FontAwesomeIcon icon={faPlus} className={'text-xs'} />
                                Add
                            </Button>
                        </div>
                        {ipError && <p className={'text-red-400 text-xs mt-1.5 mb-0'}>{ipError}</p>}
                    </div>

                    {allowedIps.length > 0 ? (
                        <div
                            className={classNames('p-3 rounded-lg flex flex-wrap', realmClasses.insetPanel)}
                        >
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
                            No IPs added — all connections will be allowed when whitelist is disabled.
                        </div>
                    )}
                </div>

                <div
                    css={tw`mt-6 pt-4 border-t border-realm-border flex justify-end gap-3`}
                >
                    <Button.Text size={Button.Sizes.Small} onClick={handleDismiss} disabled={saving}>
                        Cancel
                    </Button.Text>
                    <Button size={Button.Sizes.Small} disabled={saving} onClick={save}>
                        {saving ? 'Saving…' : 'Save'}
                    </Button>
                </div>
            </div>
        </Drawer>
    );
};

export default AllocationFirewallModal;
