import React, { useState } from 'react';
import { Dialog } from '@/components/elements/dialog';
import { Button } from '@/components/elements/button/index';
import Switch from '@/components/elements/Switch';
import Select from '@/components/elements/Select';
import { Allocation, AllocationProtocol } from '@/api/server/getServer';
import setAllocationWhitelist from '@/api/server/network/setAllocationWhitelist';
import { useFlashKey } from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';
import getServerAllocations from '@/api/swr/getServerAllocations';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimes, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import FlashMessageRender from '@/components/FlashMessageRender';

const IpTag = styled.span`
    ${tw`inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-md mr-1.5 mb-1.5`};
    background-color: #0e1417;
    border: 1px solid #2d3338;
    color: #94a3b8;
`;

interface Props {
    open: boolean;
    allocation: Allocation;
    onClose: () => void;
}

const AllocationFirewallModal = ({ open, allocation, onClose }: Props) => {
    const [saving, setSaving] = useState(false);
    const [enabled, setEnabled] = useState(allocation.whitelistEnabled);
    const [protocol, setProtocol] = useState<AllocationProtocol>(allocation.protocol);
    const [allowedIps, setAllowedIps] = useState<string[]>(allocation.allowedIps);
    const [ipInput, setIpInput] = useState('');
    const [ipError, setIpError] = useState('');

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { mutate } = getServerAllocations();
    const { clearFlashes, clearAndAddHttpError } = useFlashKey('server:network');

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

    const removeIp = (ip: string) => setAllowedIps((prev) => prev.filter((i) => i !== ip));

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addIp();
        }
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
                onClose();
            })
            .catch((error) => clearAndAddHttpError(error))
            .finally(() => setSaving(false));
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={''}
            hideCloseIcon
        >
            {/* Custom header */}
            <div
                className={'flex items-center justify-between px-1 pb-4 border-b mb-5'}
                style={{ borderColor: '#2d3338' }}
            >
                <div className={'flex items-center gap-3'}>
                    <div>
                        <p className={'font-semibold text-neutral-100'}>IP Whitelist</p>
                        <p className={'text-xs text-neutral-400 font-mono'}>
                            {allocation.alias ?? allocation.ip}:{allocation.port}
                        </p>
                    </div>
                </div>
                <button
                    className={'text-neutral-500 hover:text-neutral-300 transition-colors p-1'}
                    onClick={onClose}
                >
                    <FontAwesomeIcon icon={faTimes} />
                </button>
            </div>

            <FlashMessageRender byKey={'server:network'} className={'mb-4'} />

            {/* Enable toggle */}
            <div
                className={'flex items-center justify-between p-4 rounded-lg mb-4'}
                style={{ backgroundColor: '#0e1417', border: '1px solid #2d3338' }}
            >
                <div>
                    <p className={'text-sm font-medium text-neutral-200'}>Enable Whitelist</p>
                    <p className={'text-xs text-neutral-500 mt-0.5'}>
                        Restrict connections to this port to listed IPs only.
                    </p>
                </div>
                <Switch
                    name={`whitelist_enabled_${allocation.id}`}
                    defaultChecked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                />
            </div>

            {/* Protocol */}
            <div className={'mb-4'}>
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

            {/* IP list */}
            <div className={'mb-2'}>
                <label className={'block text-xs uppercase tracking-wide text-neutral-400 mb-1.5'}>
                    Allowed IPs &amp; CIDR Ranges
                </label>
                <div className={'flex gap-2'}>
                    <input
                        className={'flex-1 rounded text-sm px-3 py-2 focus:outline-none transition-colors duration-150'}
                        style={{
                            backgroundColor: '#0e1417',
                            border: '1px solid #2d3338',
                            color: '#e2e8f0',
                        }}
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
                {ipError && (
                    <p className={'text-red-400 text-xs mt-1.5'}>{ipError}</p>
                )}
            </div>

            {/* IP tags */}
            {allowedIps.length > 0 ? (
                <div
                    className={'p-3 rounded-lg mb-4 flex flex-wrap'}
                    style={{ backgroundColor: '#0e1417', border: '1px solid #2d3338' }}
                >
                    {allowedIps.map((ip) => (
                        <IpTag key={ip}>
                            {ip}
                            <button
                                className={'text-neutral-600 hover:text-red-400 transition-colors duration-150 ml-0.5'}
                                onClick={() => removeIp(ip)}
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </IpTag>
                    ))}
                </div>
            ) : (
                <div
                    className={'flex items-center gap-2 p-3 rounded-lg mb-4 text-xs text-neutral-500'}
                    style={{ backgroundColor: '#0e1417', border: '1px solid #2d3338' }}
                >
                    <FontAwesomeIcon icon={faInfoCircle} />
                    No IPs added — all connections will be allowed when whitelist is disabled.
                </div>
            )}

            {/* Footer */}
            <Dialog.Footer>
                <Button.Text size={Button.Sizes.Small} onClick={onClose}>
                    Cancel
                </Button.Text>
                <Button
                    size={Button.Sizes.Small}
                    disabled={saving}
                    onClick={save}
                    className={'ml-2'}
                >
                    {saving ? 'Saving…' : 'Save'}
                </Button>
            </Dialog.Footer>
        </Dialog>
    );
};

export default AllocationFirewallModal;
