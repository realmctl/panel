import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useHistory, useRouteMatch } from 'react-router-dom';
import classNames from 'classnames';
import { format } from 'date-fns';
import { Schedule } from '@/api/server/schedules/getServerSchedules';
import { ServerContext } from '@/state/server';
import useFlash from '@/plugins/useFlash';
import { httpErrorToHuman } from '@/api/http';
import duplicateSchedule from '@/api/server/schedules/duplicateSchedule';
import exportSchedule from '@/api/server/schedules/exportSchedule';
import EditScheduleModal from '@/components/server/schedules/EditScheduleModal';

interface MenuPosition {
    x: number;
    y: number;
}

const ScheduleContextMenu = ({
    position,
    onClose,
    onDuplicate,
    onEdit,
    onExport,
}: {
    position: MenuPosition;
    onClose: () => void;
    onDuplicate: () => void;
    onEdit: () => void;
    onExport: () => void;
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

    const left = Math.min(position.x, window.innerWidth - 180);
    const top = Math.min(position.y, window.innerHeight - 130);

    const item = (label: string, onClick: () => void) => (
        <button
            type={'button'}
            onClick={() => {
                onClick();
                onClose();
            }}
            className={
                'w-full text-left px-3 py-2 text-sm text-neutral-200 bg-transparent border-0 cursor-pointer hover:bg-white/5'
            }
        >
            {label}
        </button>
    );

    return createPortal(
        <div
            ref={menuRef}
            style={{ position: 'fixed', left, top }}
            className={'z-[9999] w-40 rounded-md border border-realm-border/60 bg-realm-popover shadow-lg py-1'}
        >
            {item('Duplicate', onDuplicate)}
            {item('Edit', onEdit)}
            {item('Export', onExport)}
        </div>,
        document.body
    );
};

interface Props {
    schedule: Schedule;
    bulkMode: boolean;
    selected: boolean;
    onToggleSelected: (id: number) => void;
}

export default ({ schedule, bulkMode, selected, onToggleSelected }: Props) => {
    const match = useRouteMatch();
    const history = useHistory();
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const appendSchedule = ServerContext.useStoreActions((actions) => actions.schedules.appendSchedule);
    const { addError, addFlash } = useFlash();

    const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const cronExpression = `${schedule.cron.minute} ${schedule.cron.hour} ${schedule.cron.dayOfMonth} ${schedule.cron.month} ${schedule.cron.dayOfWeek}`;

    const onDuplicate = () => {
        duplicateSchedule(uuid, schedule.id)
            .then((copy) => {
                appendSchedule(copy);
                history.push(`${match.url}/${copy.id}`);
            })
            .catch((error) => addError({ message: httpErrorToHuman(error), key: 'automation' }));
    };

    const onExport = () => {
        exportSchedule(uuid, schedule.id)
            .then((template) => {
                const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${schedule.name || 'automation'}.json`;
                link.click();
                URL.revokeObjectURL(url);
                addFlash({ type: 'success', key: 'automation', message: 'Automation exported.' });
            })
            .catch((error) => addError({ message: httpErrorToHuman(error), key: 'automation' }));
    };

    return (
        <>
            <EditScheduleModal
                visible={showEditModal}
                schedule={schedule}
                onModalDismissed={() => setShowEditModal(false)}
            />

            {menuPosition && (
                <ScheduleContextMenu
                    position={menuPosition}
                    onClose={() => setMenuPosition(null)}
                    onDuplicate={onDuplicate}
                    onEdit={() => setShowEditModal(true)}
                    onExport={onExport}
                />
            )}

            <div
                className={classNames(
                    'flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-realm-surface/40 transition-colors duration-150',
                    bulkMode && selected && 'bg-blue-500/5'
                )}
                onClick={() => {
                    if (bulkMode) {
                        onToggleSelected(schedule.id);
                        return;
                    }
                    history.push(`${match.url}/${schedule.id}`);
                }}
                onContextMenu={(e) => {
                    e.preventDefault();
                    setMenuPosition({ x: e.clientX, y: e.clientY });
                }}
            >
                {bulkMode && <input type={'checkbox'} checked={selected} readOnly className={'flex-shrink-0'} />}

                <div className={'grid grid-cols-12 gap-4 items-center flex-1 min-w-0'}>
                    <div className={'col-span-5 min-w-0'}>
                        <p className={'text-sm font-medium text-neutral-200 m-0 truncate'}>{schedule.name}</p>
                        <p className={'text-xs text-neutral-500 m-0 mt-0.5'}>
                            Last run: {schedule.lastRunAt ? format(schedule.lastRunAt, "MMM do 'at' h:mma") : 'never'}
                        </p>
                    </div>
                    <div className={'col-span-4'}>
                        <code className={'text-xs font-mono text-neutral-400'}>{cronExpression}</code>
                    </div>
                    <div className={'col-span-3 flex justify-end'}>
                        <span
                            className={classNames(
                                'py-1 px-3 rounded text-xs uppercase text-white',
                                schedule.isActive && !schedule.isProcessing ? 'bg-green-600' : 'bg-neutral-500'
                            )}
                        >
                            {schedule.isProcessing ? 'Processing' : schedule.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
};
