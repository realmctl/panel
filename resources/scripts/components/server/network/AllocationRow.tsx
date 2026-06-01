import React, { memo, useCallback, useState } from 'react';
import isEqual from 'react-fast-compare';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldAlt, faStar } from '@fortawesome/free-solid-svg-icons';
import InputSpinner from '@/components/elements/InputSpinner';
import { Textarea } from '@/components/elements/Input';
import Can from '@/components/elements/Can';
import { Button } from '@/components/elements/button/index';
import { Allocation } from '@/api/server/getServer';
import { debounce } from 'debounce';
import setServerAllocationNotes from '@/api/server/network/setServerAllocationNotes';
import { useFlashKey } from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';
import CopyOnClick from '@/components/elements/CopyOnClick';
import DeleteAllocationButton from '@/components/server/network/DeleteAllocationButton';
import setPrimaryServerAllocation from '@/api/server/network/setPrimaryServerAllocation';
import getServerAllocations from '@/api/swr/getServerAllocations';
import { ip } from '@/lib/formatters';
import AllocationFirewallModal from '@/components/server/network/AllocationFirewallModal';

const PROTOCOL_LABEL: Record<string, string> = {
    tcp: 'TCP',
    udp: 'UDP',
    both: 'TCP+UDP',
};

interface Props {
    allocation: Allocation;
}

const AllocationRow = ({ allocation }: Props) => {
    const [notesLoading, setNotesLoading] = useState(false);
    const [showFirewall, setShowFirewall] = useState(false);
    const { clearFlashes, clearAndAddHttpError } = useFlashKey('server:network');
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { mutate } = getServerAllocations();

    const onNotesChanged = useCallback((id: number, notes: string) => {
        mutate((data) => data?.map((a) => (a.id === id ? { ...a, notes } : a)), false);
    }, []);

    const setAllocationNotes = debounce((notes: string) => {
        setNotesLoading(true);
        clearFlashes();
        setServerAllocationNotes(uuid, allocation.id, notes)
            .then(() => onNotesChanged(allocation.id, notes))
            .catch((error) => clearAndAddHttpError(error))
            .then(() => setNotesLoading(false));
    }, 750);

    const setPrimaryAllocation = () => {
        clearFlashes();
        mutate((data) => data?.map((a) => ({ ...a, isDefault: a.id === allocation.id })), false);
        setPrimaryServerAllocation(uuid, allocation.id).catch((error) => {
            clearAndAddHttpError(error);
            mutate();
        });
    };

    return (
        <>
            <AllocationFirewallModal
                open={showFirewall}
                allocation={allocation}
                onClose={() => setShowFirewall(false)}
            />

            <div
                className={'rounded-lg overflow-hidden flex flex-col transition-shadow duration-150'}
                style={{
                    backgroundColor: '#192024',
                    border: '1px solid #2d3338',
                }}
            >
                {/* Card header */}
                <div
                    className={'flex items-center justify-between px-4 py-3'}
                    style={{ backgroundColor: '#0e1417', borderBottom: '1px solid #2d3338' }}
                >
                    <div className={'flex items-center gap-3'}>
                        <div className={'flex items-center gap-2 flex-wrap'}>
                            {allocation.isDefault && (
                                <span
                                    className={'text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide'}
                                    style={{ backgroundColor: '#0e4a5c', color: '#22d3ee' }}
                                >
                                    Primary
                                </span>
                            )}
                            <span
                                className={'text-xs px-2 py-0.5 rounded-full uppercase tracking-wide font-medium'}
                                style={{ backgroundColor: '#1e2d38', color: '#94a3b8' }}
                            >
                                {PROTOCOL_LABEL[allocation.protocol] ?? 'TCP'}
                            </span>
                            {allocation.whitelistEnabled && (
                                <span
                                    className={'flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium'}
                                    style={{ backgroundColor: '#0d2f2a', color: '#34d399' }}
                                >
                                    <FontAwesomeIcon icon={faShieldAlt} className={'text-xs'} />
                                    Whitelisted
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Delete / primary star */}
                    <div className={'flex items-center gap-2'}>
                        {!allocation.isDefault && (
                            <>
                                <Can action={'allocation.update'}>
                                    <button
                                        className={'text-neutral-500 hover:text-yellow-400 transition-colors duration-150 p-1'}
                                        title={'Set as primary'}
                                        onClick={setPrimaryAllocation}
                                    >
                                        <FontAwesomeIcon icon={faStar} className={'text-sm'} />
                                    </button>
                                </Can>
                                <Can action={'allocation.delete'}>
                                    <DeleteAllocationButton allocation={allocation.id} />
                                </Can>
                            </>
                        )}
                    </div>
                </div>

                {/* IP : Port */}
                <div className={'px-4 pt-4 pb-3'}>
                    <CopyOnClick text={`${allocation.alias ?? ip(allocation.ip)}:${allocation.port}`}>
                        <div className={'flex items-baseline gap-1 cursor-pointer group'}>
                            <span
                                className={'text-xl font-mono font-semibold group-hover:text-cyan-300 transition-colors duration-150'}
                                style={{ color: '#e2e8f0' }}
                            >
                                {allocation.alias ?? ip(allocation.ip)}
                            </span>
                            <span className={'text-neutral-500 font-mono text-lg'}>:</span>
                            <span
                                className={'text-xl font-mono font-bold group-hover:text-cyan-300 transition-colors duration-150'}
                                style={{ color: '#22d3ee' }}
                            >
                                {allocation.port}
                            </span>
                        </div>
                    </CopyOnClick>
                    {allocation.alias && (
                        <p className={'text-xs text-neutral-500 mt-0.5 font-mono'}>{ip(allocation.ip)}</p>
                    )}
                </div>

                {/* Notes */}
                <div className={'px-4 pb-3 flex-1'}>
                    <InputSpinner visible={notesLoading}>
                        <Textarea
                            className={'text-sm resize-none'}
                            style={{
                                backgroundColor: '#0e1417',
                                border: '1px solid #2d3338',
                                color: '#94a3b8',
                                borderRadius: '0.375rem',
                                padding: '0.5rem 0.75rem',
                            }}
                            rows={2}
                            placeholder={'Add a note for this allocation...'}
                            defaultValue={allocation.notes || undefined}
                            onChange={(e) => setAllocationNotes(e.currentTarget.value)}
                        />
                    </InputSpinner>
                </div>

                {/* Footer actions */}
                <div
                    className={'px-4 py-3 flex items-center justify-end gap-2'}
                    style={{ borderTop: '1px solid #2d3338' }}
                >
                    <Can action={'allocation.update'}>
                        <Button.Text
                            size={Button.Sizes.Small}
                            className={'flex items-center gap-1.5'}
                            style={allocation.whitelistEnabled ? { color: '#34d399' } : undefined}
                            onClick={() => setShowFirewall(true)}
                        >
                            <FontAwesomeIcon icon={faShieldAlt} className={'text-xs'} />
                            Firewall
                        </Button.Text>
                    </Can>

                    {!allocation.isDefault && (
                        <Can action={'allocation.update'}>
                            <Button.Text size={Button.Sizes.Small} onClick={setPrimaryAllocation}>
                                Make Primary
                            </Button.Text>
                        </Can>
                    )}
                </div>
            </div>
        </>
    );
};

export default memo(AllocationRow, isEqual);
