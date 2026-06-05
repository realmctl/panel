import React, { useContext, useEffect, useState } from 'react';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import Can from '@/components/elements/Can';
import CreateBackupButton from '@/components/server/backups/CreateBackupButton';
import FlashMessageRender from '@/components/FlashMessageRender';
import BackupRow from '@/components/server/backups/BackupRow';
import getServerBackups, { Context as ServerBackupContext } from '@/api/swr/getServerBackups';
import { ServerContext } from '@/state/server';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import Pagination from '@/components/elements/Pagination';
import { Dialog } from '@/components/elements/dialog';
import deleteAllBackups from '@/api/server/backups/deleteAllBackups';

const BackupContainer = () => {
    const { page, setPage } = useContext(ServerBackupContext);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { data: backups, error, isValidating, mutate } = getServerBackups();
    const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
    const [deletingAll, setDeletingAll] = useState(false);

    const uuid        = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const backupLimit = ServerContext.useStoreState((state) => state.server.data!.featureLimits.backups);

    const doDeleteAll = () => {
        setDeletingAll(true);
        clearFlashes('backups');
        deleteAllBackups(uuid)
            .then(() =>
                mutate(
                    (data) => ({
                        ...data,
                        items: data.items.filter((b) => b.isLocked),
                        backupCount: data.items.filter((b) => b.isLocked).length,
                    }),
                    false
                )
            )
            .catch((error) => clearAndAddHttpError({ error, key: 'backups' }))
            .then(() => { setDeletingAll(false); setShowDeleteAllDialog(false); });
    };

    useEffect(() => {
        if (!error) { clearFlashes('backups'); return; }
        clearAndAddHttpError({ error, key: 'backups' });
    }, [error]);

    if (!backups || (error && isValidating)) {
        return <Spinner size={'large'} centered />;
    }

    return (
        <ServerContentBlock title={'Backups'}>
            <Dialog.Confirm
                open={showDeleteAllDialog}
                onClose={() => setShowDeleteAllDialog(false)}
                title={'Delete All Backups'}
                confirm={'Delete All'}
                onConfirmed={doDeleteAll}
            >
                This will permanently delete all unlocked backups for this server. Locked backups will not be removed.
                This action cannot be undone.
            </Dialog.Confirm>

            {backupLimit > 0 && backups.backupCount > 0 && (
                <div className={'flex items-center justify-between mb-6'}>
                    <span className={'text-sm text-neutral-400'}>
                        <span className={'text-neutral-100 font-semibold'}>{backups.backupCount}</span>
                        <span className={'text-neutral-600'}> / </span>
                        {backupLimit} backups used
                    </span>
                    <div className={'flex items-center gap-2'}>
                        <Can action={'backup.delete'}>
                            <button
                                disabled={deletingAll}
                                onClick={() => setShowDeleteAllDialog(true)}
                                className={'px-3 py-1.5 text-xs font-medium rounded transition-colors duration-150 disabled:opacity-50'}
                                style={{
                                    border: '1px solid rgba(239,68,68,0.3)',
                                    backgroundColor: 'rgba(239,68,68,0.08)',
                                    color: '#f87171',
                                }}
                            >
                                {deletingAll ? 'Deleting…' : 'Delete All'}
                            </button>
                        </Can>
                        <Can action={'backup.create'}>
                            {backupLimit > backups.backupCount && <CreateBackupButton />}
                        </Can>
                    </div>
                </div>
            )}

            <FlashMessageRender byKey={'backups'} className={'mb-4'} />

            <Pagination data={backups} onPageSelect={setPage}>
                {({ items }) =>
                    !items.length ? (
                        <div className={'flex flex-col items-center justify-center py-16'}>
                            <h3 className={'text-lg font-semibold text-neutral-100 mb-1'}>
                                {backupLimit === 0 ? 'Backups unavailable' : 'No backups yet'}
                            </h3>
                            <p className={'text-sm text-neutral-400 text-center max-w-sm'}>
                                {backupLimit === 0
                                    ? 'Backups cannot be created for this server because the backup limit is set to 0.'
                                    : page > 1
                                        ? "Looks like we've run out of backups to show you, try going back a page."
                                        : 'Create a backup to protect your server data.'}
                            </p>
                            {backupLimit > 0 && (
                                <Can action={'backup.create'}>
                                    {backupLimit > backups.backupCount && (
                                        <div className={'mt-6'}>
                                            <CreateBackupButton />
                                        </div>
                                    )}
                                </Can>
                            )}
                        </div>
                    ) : (
                        <div className={'grid grid-cols-1 md:grid-cols-2 gap-3'}>
                            {items.map((backup) => (
                                <BackupRow key={backup.uuid} backup={backup} />
                            ))}
                        </div>
                    )
                }
            </Pagination>
        </ServerContentBlock>
    );
};

export default () => {
    const [page, setPage] = useState<number>(1);
    return (
        <ServerBackupContext.Provider value={{ page, setPage }}>
            <BackupContainer />
        </ServerBackupContext.Provider>
    );
};
