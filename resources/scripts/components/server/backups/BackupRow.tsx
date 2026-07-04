import React from 'react';
import classNames from 'classnames';
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
    const isFailed = backup.completedAt !== null && !backup.isSuccessful;

    return (
        <div className={classNames('grid grid-cols-12 gap-4 items-center px-4 py-3', className)}>
            <div className={'col-span-4 min-w-0'}>
                <p className={'text-sm font-medium text-neutral-200 m-0 truncate'}>{backup.name}</p>
                {backup.checksum && (
                    <p className={'font-mono text-xs text-neutral-500 truncate m-0 mt-0.5'}>{backup.checksum}</p>
                )}
            </div>
            <div className={'col-span-3 flex items-center gap-1.5 flex-wrap'}>
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
            <div className={'col-span-2'}>
                {backup.completedAt !== null && backup.isSuccessful && (
                    <span className={'text-xs font-mono text-neutral-500'}>{bytesToString(backup.bytes)}</span>
                )}
            </div>
            <div className={'col-span-2'}>
                <p
                    className={'text-xs text-neutral-500 m-0'}
                    title={format(backup.createdAt, 'ddd, MMMM do, yyyy HH:mm:ss')}
                >
                    {formatDistanceToNow(backup.createdAt, { includeSeconds: true, addSuffix: true })}
                </p>
            </div>
            <div className={'col-span-1 flex items-center justify-end'}>
                <Can action={['backup.download', 'backup.restore', 'backup.delete']} matchAny>
                    {isRunning ? <Spinner size={'small'} /> : <BackupContextMenu backup={backup} />}
                </Can>
            </div>
        </div>
    );
};
