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
    const [createVisible, setCreateVisible] = useState(false);

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
                                        : 'Backups let you snapshot your server files and restore them when something goes wrong.'}
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
                        <div className={'rounded-md border border-realm-border/50 bg-realm-card overflow-hidden'}>
                            <div className={'hidden sm:grid grid-cols-12 gap-4 px-4 py-2 border-b border-realm-border/50'}>
                                <div className={'col-span-4 text-xs font-medium uppercase tracking-wide text-neutral-500'}>
                                    Name
                                </div>
                                <div className={'col-span-3 text-xs font-medium uppercase tracking-wide text-neutral-500'}>
                                    Status
                                </div>
                                <div className={'col-span-2 text-xs font-medium uppercase tracking-wide text-neutral-500'}>
                                    Size
                                </div>
                                <div className={'col-span-2 text-xs font-medium uppercase tracking-wide text-neutral-500'}>
                                    Created
                                </div>
                                <div className={'col-span-1'} />
                            </div>
                            <div className={'divide-y divide-realm-border/50'}>
                                {items.map((backup) => (
                                    <BackupRow key={backup.uuid} backup={backup} />
                                ))}
                            </div>
                        </div>
                    )
                }
            </Pagination>

            {backupLimit > 0 && backups.items.length > 0 && (
                <div className={'flex items-center justify-between gap-4 mt-4'}>
                    <p className={'text-sm text-neutral-500 m-0'}>
                        {backups.backupCount} of {backupLimit} backups allocated to this server.{' '}
                        <Can action={'backup.create'}>
                            {backupLimit > backups.backupCount && (
                                <>
                                    <button
                                        type={'button'}
                                        onClick={() => setCreateVisible(true)}
                                        className={
                                            'bg-transparent border-0 p-0 text-blue-600 hover:text-blue-500 cursor-pointer'
                                        }
                                    >
                                        Create a new backup
                                    </button>
                                    <CreateBackupButton
                                        visible={createVisible}
                                        onDismissed={() => setCreateVisible(false)}
                                        hideTrigger
                                    />
                                    .
                                </>
                            )}
                        </Can>
                    </p>

                    <Can action={'backup.delete'}>
                        <button
                            type={'button'}
                            disabled={deletingAll}
                            onClick={() => setShowDeleteAllDialog(true)}
                            className={
                                'text-sm bg-transparent border-0 p-0 text-red-500 hover:text-red-400 cursor-pointer disabled:opacity-60 flex-shrink-0'
                            }
                        >
                            {deletingAll ? 'Deleting…' : 'Delete all backups'}
                        </button>
                    </Can>
                </div>
            )}
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
