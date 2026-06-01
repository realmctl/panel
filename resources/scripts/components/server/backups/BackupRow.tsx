import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import { format, formatDistanceToNow } from 'date-fns';
import Spinner from '@/components/elements/Spinner';
import { bytesToString } from '@/lib/formatters';
import Can from '@/components/elements/Can';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import BackupContextMenu from '@/components/server/backups/BackupContextMenu';
import getServerBackups from '@/api/swr/getServerBackups';
import { ServerBackup } from '@/api/server/types';
import { SocketEvent } from '@/components/server/events';

interface Props {
    backup: ServerBackup;
    className?: string;
}

export default ({ backup, className }: Props) => {
    const { mutate } = getServerBackups();

    useWebsocketEvent(`${SocketEvent.BACKUP_COMPLETED}:${backup.uuid}` as SocketEvent, (data) => {
        try {
            const parsed = JSON.parse(data);
            mutate(
                (data) => ({
                    ...data,
                    items: data.items.map((b) =>
                        b.uuid !== backup.uuid
                            ? b
                            : {
                                  ...b,
                                  isSuccessful: parsed.is_successful || true,
                                  checksum: (parsed.checksum_type || '') + ':' + (parsed.checksum || ''),
                                  bytes: parsed.file_size || 0,
                                  completedAt: new Date(),
                              }
                    ),
                }),
                false
            );
        } catch (e) {
            console.warn(e);
        }
    });

    const isRunning = backup.completedAt === null;
    const isFailed  = backup.completedAt !== null && !backup.isSuccessful;

    return (
        <div
            className={`rounded-lg overflow-hidden ${className ?? ''}`}
            style={{ backgroundColor: '#192024', border: '1px solid #2d3338' }}
        >
            {/* Card header */}
            <div
                className={'flex items-center justify-between px-4 py-3'}
                style={{ backgroundColor: '#0e1417', borderBottom: '1px solid #2d3338' }}
            >
                <div className={'flex items-center gap-2'}>
                    {isRunning && (
                        <span
                            className={'text-xs px-2 py-0.5 rounded-full font-medium'}
                            style={{ backgroundColor: '#1e3a5f', color: '#60a5fa' }}
                        >
                            In Progress
                        </span>
                    )}
                    {isFailed && (
                        <span
                            className={'text-xs px-2 py-0.5 rounded-full font-medium'}
                            style={{ backgroundColor: '#450a0a', color: '#fca5a5' }}
                        >
                            Failed
                        </span>
                    )}
                    {!isRunning && !isFailed && (
                        <span
                            className={'text-xs px-2 py-0.5 rounded-full font-medium'}
                            style={{ backgroundColor: '#0d2f2a', color: '#34d399' }}
                        >
                            Complete
                        </span>
                    )}
                    {backup.isLocked && (
                        <span
                            className={'flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium'}
                            style={{ backgroundColor: '#422006', color: '#fbbf24' }}
                        >
                            <FontAwesomeIcon icon={faLock} className={'text-xs'} />
                            Locked
                        </span>
                    )}
                </div>

                <Can action={['backup.download', 'backup.restore', 'backup.delete']} matchAny>
                    {isRunning ? (
                        <Spinner size={'small'} />
                    ) : (
                        <BackupContextMenu backup={backup} />
                    )}
                </Can>
            </div>

            {/* Card body */}
            <div className={'px-4 py-4'}>
                <p className={'font-medium text-neutral-100 truncate mb-1'}>{backup.name}</p>
                {backup.checksum && (
                    <p className={'font-mono text-xs text-neutral-500 truncate'}>{backup.checksum}</p>
                )}
            </div>

            {/* Card footer */}
            <div
                className={'flex items-center justify-between px-4 py-3 gap-4'}
                style={{ borderTop: '1px solid #2d3338' }}
            >
                <div className={'flex items-center gap-3'}>
                    {backup.completedAt !== null && backup.isSuccessful && (
                        <span
                            className={'text-xs font-mono px-2 py-0.5 rounded'}
                            style={{ backgroundColor: '#0e1417', color: '#64748b' }}
                        >
                            {bytesToString(backup.bytes)}
                        </span>
                    )}
                </div>
                <p
                    className={'text-xs text-neutral-500'}
                    title={format(backup.createdAt, 'ddd, MMMM do, yyyy HH:mm:ss')}
                >
                    {formatDistanceToNow(backup.createdAt, { includeSeconds: true, addSuffix: true })}
                </p>
            </div>
        </div>
    );
};
