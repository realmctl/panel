import React, { useEffect, useState } from 'react';
import { Button } from '@/components/elements/button/index';
import Fade from '@/components/elements/Fade';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import useFlash from '@/plugins/useFlash';
import compressFiles from '@/api/server/files/compressFiles';
import { ServerContext } from '@/state/server';
import deleteFiles from '@/api/server/files/deleteFiles';
import RenameFileModal from '@/components/server/files/RenameFileModal';
import Portal from '@/components/elements/Portal';
import { Dialog } from '@/components/elements/dialog';
import { XIcon } from '@heroicons/react/solid';

const MassActionsBar = () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    const { mutate } = useFileManagerSwr();
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);
    const [showMove, setShowMove] = useState(false);
    const directory = ServerContext.useStoreState((state) => state.files.directory);

    const selectedFiles = ServerContext.useStoreState((state) => state.files.selectedFiles);
    const setSelectedFiles = ServerContext.useStoreActions((actions) => actions.files.setSelectedFiles);

    useEffect(() => {
        if (!loading) setLoadingMessage('');
    }, [loading]);

    const onClickCompress = () => {
        setLoading(true);
        clearFlashes('files');
        setLoadingMessage('Archiving files...');

        compressFiles(uuid, directory, selectedFiles)
            .then(() => mutate())
            .then(() => setSelectedFiles([]))
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setLoading(false));
    };

    const onClickConfirmDeletion = () => {
        setLoading(true);
        setShowConfirm(false);
        clearFlashes('files');
        setLoadingMessage('Deleting files...');

        deleteFiles(uuid, directory, selectedFiles)
            .then(() => {
                mutate((files) => files.filter((f) => selectedFiles.indexOf(f.name) < 0), false);
                setSelectedFiles([]);
            })
            .catch((error) => {
                mutate();
                clearAndAddHttpError({ key: 'files', error });
            })
            .then(() => setLoading(false));
    };

    return (
        <>
            <SpinnerOverlay visible={loading} size={'large'} fixed>
                {loadingMessage}
            </SpinnerOverlay>
            <Dialog.Confirm
                title={'Delete Files'}
                open={showConfirm}
                confirm={'Delete'}
                onClose={() => setShowConfirm(false)}
                onConfirmed={onClickConfirmDeletion}
            >
                <p className={'mb-2'}>
                    Are you sure you want to delete&nbsp;
                    <span className={'font-semibold text-gray-50'}>{selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'}</span>?
                    This is permanent and cannot be undone.
                </p>
                {selectedFiles.slice(0, 15).map((file) => (
                    <li key={file}>{file}</li>
                ))}
                {selectedFiles.length > 15 && <li>and {selectedFiles.length - 15} others</li>}
            </Dialog.Confirm>
            {showMove && (
                <RenameFileModal
                    files={selectedFiles}
                    visible
                    appear
                    useMoveTerminology
                    onDismissed={() => setShowMove(false)}
                />
            )}
            <Portal>
                <div className={'pointer-events-none fixed bottom-0 mb-6 flex justify-center w-full z-50'}>
                    <Fade timeout={100} in={selectedFiles.length > 0} unmountOnExit>
                        <div className={'pointer-events-auto flex items-center gap-2 rounded-lg border border-white/10 bg-[#0f1417]/90 backdrop-blur-sm px-3 py-2 shadow-2xl'}>
                            <span className={'text-xs text-neutral-400 pr-2 border-r border-white/10 mr-1'}>
                                {selectedFiles.length} selected
                            </span>
                            <Button size={Button.Sizes.Small} onClick={() => setShowMove(true)}>
                                Move
                            </Button>
                            <Button size={Button.Sizes.Small} onClick={onClickCompress}>
                                Archive
                            </Button>
                            <Button.Danger size={Button.Sizes.Small} variant={Button.Variants.Secondary} onClick={() => setShowConfirm(true)}>
                                Delete
                            </Button.Danger>
                            <button
                                type={'button'}
                                onClick={() => setSelectedFiles([])}
                                className={'ml-1 p-1 rounded text-neutral-500 hover:text-neutral-200 hover:bg-white/5 transition-colors'}
                                title={'Clear selection'}
                            >
                                <XIcon className={'w-3.5 h-3.5'} />
                            </button>
                        </div>
                    </Fade>
                </div>
            </Portal>
        </>
    );
};

export default MassActionsBar;
