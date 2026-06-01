import React, { useContext, useEffect, useState } from 'react';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import Can from '@/components/elements/Can';
import CreateBackupButton from '@/components/server/backups/CreateBackupButton';
import FlashMessageRender from '@/components/FlashMessageRender';
import BackupRow from '@/components/server/backups/BackupRow';
import tw from 'twin.macro';
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

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
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
            .then(() => {
                setDeletingAll(false);
                setShowDeleteAllDialog(false);
            });
    };

    useEffect(() => {
        if (!error) {
            clearFlashes('backups');

            return;
        }

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
            <FlashMessageRender byKey={'backups'} css={tw`mb-4`} />
            <Pagination data={backups} onPageSelect={setPage}>
                {({ items }) =>
                    !items.length ? (
                        !backupLimit ? null : (
                            <div className={'flex flex-col items-center justify-center py-16'}>
                                <h3 className={'text-lg font-semibold text-neutral-100 mb-1'}>No backups yet</h3>
                                <p className={'text-sm text-neutral-400 text-center max-w-sm'}>
                                    {page > 1
                                        ? "Looks like we've run out of backups to show you, try going back a page."
                                        : 'Create backups to protect your server data. You can restore from any backup at any time.'}
                                </p>
                                <Can action={'backup.create'}>
                                    {backupLimit > backups.backupCount && (
                                        <div className={'mt-6'}>
                                            <CreateBackupButton />
                                        </div>
                                    )}
                                </Can>
                            </div>
                        )
                    ) : (
                        items.map((backup, index) => (
                            <BackupRow key={backup.uuid} backup={backup} css={index > 0 ? tw`mt-2` : undefined} />
                        ))
                    )
                }
            </Pagination>
            {backupLimit === 0 && (
                <p css={tw`text-center text-sm text-neutral-300`}>
                    Backups cannot be created for this server because the backup limit is set to 0.
                </p>
            )}
            <div css={tw`mt-6 sm:flex items-center justify-end gap-3`}>
                <Can action={'backup.create'}>
                    <>
                        {backupLimit > 0 && backups.backupCount > 0 && (
                            <p css={tw`text-sm text-neutral-300 mb-4 sm:mr-6 sm:mb-0`}>
                                {backups.backupCount} of {backupLimit} backups have been created for this server.
                            </p>
                        )}
                        {backupLimit > 0 && backups.backupCount > 0 && backupLimit > backups.backupCount && (
                            <CreateBackupButton css={tw`w-full sm:w-auto`} />
                        )}
                    </>
                </Can>
                <Can action={'backup.delete'}>
                    {backups.backupCount > 0 && (
                        <button
                            disabled={deletingAll}
                            onClick={() => setShowDeleteAllDialog(true)}
                            css={tw`w-full sm:w-auto px-4 py-2 text-sm font-medium rounded border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {deletingAll ? 'Deleting...' : 'Delete All'}
                        </button>
                    )}
                </Can>
            </div>
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
