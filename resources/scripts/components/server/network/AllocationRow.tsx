import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import isEqual from 'react-fast-compare';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldAlt, faStar } from '@fortawesome/free-solid-svg-icons';
import InputSpinner from '@/components/elements/InputSpinner';
import Input from '@/components/elements/Input';
import Can from '@/components/elements/Can';
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

interface MenuPosition {
    x: number;
    y: number;
}

const AllocationMenu = ({
    position,
    onClose,
    onMakePrimary,
    onFirewall,
    showMakePrimary,
}: {
    position: MenuPosition;
    onClose: () => void;
    onMakePrimary: () => void;
    onFirewall: () => void;
    showMakePrimary: boolean;
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('mousedown', handler);
        document.addEventListener('keydown', onKeyDown);
        window.addEventListener('scroll', onClose, true);

        return () => {
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('scroll', onClose, true);
        };
    }, [onClose]);

    const left = Math.min(position.x, window.innerWidth - 200);
    const top = Math.min(position.y, window.innerHeight - 80);

    return createPortal(
        <div
            ref={menuRef}
            style={{ position: 'fixed', left, top }}
            className={
                'z-[9999] w-44 rounded-md border border-realm-border/60 bg-realm-popover shadow-lg py-1'
            }
        >
            <button
                type={'button'}
                onClick={() => {
                    onFirewall();
                    onClose();
                }}
                className={
                    'w-full text-left px-3 py-2 text-sm text-neutral-200 bg-transparent border-0 cursor-pointer hover:bg-white/5'
                }
            >
                Firewall
            </button>
            {showMakePrimary && (
                <button
                    type={'button'}
                    onClick={() => {
                        onMakePrimary();
                        onClose();
                    }}
                    className={
                        'w-full text-left px-3 py-2 text-sm text-neutral-200 bg-transparent border-0 cursor-pointer hover:bg-white/5'
                    }
                >
                    Make Primary
                </button>
            )}
        </div>,
        document.body
    );
};

interface Props {
    allocation: Allocation;
}

const AllocationRow = ({ allocation }: Props) => {
    const [notesLoading, setNotesLoading] = useState(false);
    const [showFirewall, setShowFirewall] = useState(false);
    const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
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

    const openMenuAt = (x: number, y: number) => setMenuPosition({ x, y });

    return (
        <>
            <AllocationFirewallModal
                visible={showFirewall}
                allocation={allocation}
                onDismissed={() => setShowFirewall(false)}
            />

            {menuPosition && (
                <AllocationMenu
                    position={menuPosition}
                    onClose={() => setMenuPosition(null)}
                    onMakePrimary={setPrimaryAllocation}
                    onFirewall={() => setShowFirewall(true)}
                    showMakePrimary={!allocation.isDefault}
                />
            )}

            <div
                onContextMenu={(e) => {
                    e.preventDefault();
                    openMenuAt(e.clientX, e.clientY);
                }}
                className={classNames(
                    'grid grid-cols-12 gap-4 items-center px-4 py-3 transition-colors duration-150 hover:bg-white/[0.02]'
                )}
            >
                <div className={'col-span-12 sm:col-span-3 min-w-0'}>
                    <CopyOnClick text={`${allocation.alias ?? ip(allocation.ip)}:${allocation.port}`}>
                        <span
                            className={
                                'font-mono text-sm text-neutral-200 hover:text-neutral-100 cursor-pointer truncate block'
                            }
                        >
                            {allocation.alias ?? ip(allocation.ip)}
                            <span className={'text-neutral-600'}>:</span>
                            {allocation.port}
                        </span>
                    </CopyOnClick>
                    {allocation.isDefault && (
                        <span className={'inline-flex items-center gap-1 text-xs text-neutral-500 mt-0.5'}>
                            <FontAwesomeIcon icon={faStar} className={'text-xs'} style={{ color: '#d4a853' }} />
                            Primary
                        </span>
                    )}
                </div>

                <div className={'hidden sm:block sm:col-span-1 text-sm text-neutral-400'}>
                    {PROTOCOL_LABEL[allocation.protocol] ?? 'TCP'}
                </div>

                <div className={'col-span-6 sm:col-span-2'}>
                    {allocation.whitelistEnabled ? (
                        <span
                            className={'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium'}
                            style={{ backgroundColor: '#0d2f2a', color: '#34d399' }}
                        >
                            <FontAwesomeIcon icon={faShieldAlt} className={'text-xs'} />
                            Whitelisted
                        </span>
                    ) : (
                        <span className={'text-sm text-neutral-600'}>—</span>
                    )}
                </div>

                <div className={'col-span-12 sm:col-span-3'}>
                    <InputSpinner visible={notesLoading}>
                        <Input
                            className={'text-sm'}
                            style={{ backgroundColor: '#0e1417', border: '1px solid #2d3338', color: '#94a3b8' }}
                            placeholder={'Add a note...'}
                            defaultValue={allocation.notes || undefined}
                            onChange={(e) => setAllocationNotes(e.currentTarget.value)}
                        />
                    </InputSpinner>
                </div>

                <div className={'col-span-12 sm:col-span-3 flex items-center justify-end gap-2'}>
                    {allocation.whitelistEnabled && (
                        <span
                            title={'Firewall active — right-click for options'}
                            className={'w-2 h-2 rounded-full flex-shrink-0'}
                            style={{ backgroundColor: '#059669' }}
                        />
                    )}

                    {!allocation.isDefault && (
                        <Can action={'allocation.delete'}>
                            <DeleteAllocationButton allocation={allocation.id} />
                        </Can>
                    )}
                </div>
            </div>
        </>
    );
};

export default memo(AllocationRow, isEqual);
