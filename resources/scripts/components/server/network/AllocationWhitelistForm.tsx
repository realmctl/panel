import React, { useState } from 'react';
import tw from 'twin.macro';
import { Allocation, AllocationProtocol } from '@/api/server/getServer';
import { Button } from '@/components/elements/button/index';
import Switch from '@/components/elements/Switch';
import Select from '@/components/elements/Select';
import setAllocationWhitelist from '@/api/server/network/setAllocationWhitelist';
import { useFlashKey } from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';
import getServerAllocations from '@/api/swr/getServerAllocations';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimes, faShieldAlt } from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components/macro';

const IpTag = styled.span`
    ${tw`inline-flex items-center bg-neutral-700 rounded px-2 py-0.5 text-sm text-neutral-200 mr-1 mb-1`};
`;

interface Props {
    allocation: Allocation;
    onClose: () => void;
}

const AllocationWhitelistForm = ({ allocation, onClose }: Props) => {
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
            setIpError('Enter a valid IPv4 address or CIDR (e.g. 192.168.1.1 or 10.0.0.0/24).');
            return;
        }
        if (allowedIps.includes(trimmed)) {
            setIpError('This IP is already in the list.');
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
        <div css={tw`mt-4 p-4 rounded bg-neutral-900 border border-neutral-700`}>
            <div css={tw`flex items-center justify-between mb-4`}>
                <div css={tw`flex items-center space-x-2`}>
                    <FontAwesomeIcon icon={faShieldAlt} css={tw`text-neutral-400`} />
                    <span css={tw`text-sm font-medium text-neutral-200`}>IP Whitelist</span>
                </div>
                <button css={tw`text-neutral-400 hover:text-neutral-200 transition-colors`} onClick={onClose}>
                    <FontAwesomeIcon icon={faTimes} />
                </button>
            </div>

            {/* Enabled toggle */}
            <div css={tw`mb-4`}>
                <Switch
                    name={`whitelist_enabled_${allocation.id}`}
                    label={'Enable IP Whitelist'}
                    description={'Only the listed IPs will be able to connect to this port.'}
                    defaultChecked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                />
            </div>

            {/* Protocol selector */}
            <div css={tw`mb-4`}>
                <label css={tw`text-xs uppercase text-neutral-400 block mb-1`}>Protocol</label>
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
            <div css={tw`mb-4`}>
                <label css={tw`text-xs uppercase text-neutral-400 block mb-1`}>Allowed IPs / CIDRs</label>
                <div css={tw`flex space-x-2`}>
                    <input
                        css={tw`flex-1 bg-neutral-800 border border-neutral-600 rounded px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-400`}
                        placeholder={'e.g. 192.168.1.1 or 10.0.0.0/24'}
                        value={ipInput}
                        onChange={(e) => {
                            setIpInput(e.target.value);
                            setIpError('');
                        }}
                        onKeyDown={handleKeyDown}
                        disabled={!enabled}
                    />
                    <Button
                        type={'button'}
                        size={Button.Sizes.Small}
                        onClick={addIp}
                        disabled={!enabled || !ipInput.trim()}
                    >
                        <FontAwesomeIcon icon={faPlus} />
                    </Button>
                </div>
                {ipError && <p css={tw`text-red-400 text-xs mt-1`}>{ipError}</p>}

                {allowedIps.length > 0 && (
                    <div css={tw`mt-2 flex flex-wrap`}>
                        {allowedIps.map((ip) => (
                            <IpTag key={ip}>
                                {ip}
                                <button
                                    css={tw`ml-1.5 text-neutral-400 hover:text-red-400 transition-colors`}
                                    onClick={() => removeIp(ip)}
                                >
                                    <FontAwesomeIcon icon={faTimes} size={'xs'} />
                                </button>
                            </IpTag>
                        ))}
                    </div>
                )}

                {allowedIps.length === 0 && (
                    <p css={tw`text-neutral-500 text-xs mt-1`}>No IPs added yet. All connections are allowed.</p>
                )}
            </div>

            {/* Save */}
            <div css={tw`flex justify-end space-x-2`}>
                <Button.Text size={Button.Sizes.Small} onClick={onClose}>
                    Cancel
                </Button.Text>
                <Button size={Button.Sizes.Small} onClick={save} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Whitelist'}
                </Button>
            </div>
        </div>
    );
};

export default AllocationWhitelistForm;
