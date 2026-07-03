import React, { useEffect, useRef } from 'react';
import axios from 'axios';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import { useFlashKey } from '@/plugins/useFlash';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import { ServerContext } from '@/state/server';
import { WithClassname } from '@/components/types';
import { CloudUploadIcon, DocumentIcon, FolderIcon } from '@heroicons/react/outline';
import { useSignal } from '@preact/signals-react';
import styles from './style.module.css';
import ExplorerIconTooltip from '@/components/server/files/ExplorerIconTooltip';
import { uploadFilesToDirectory } from '@/components/server/files/fileUploadUtils';

interface Props extends WithClassname {
    iconOnly?: boolean;
    onUploaded?: () => void;
}

export default ({ className, iconOnly = false, onUploaded }: Props) => {
    const fileUploadInput = useRef<HTMLInputElement>(null);
    const folderUploadInput = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const showDropdown = useSignal(false);

    const { mutate } = useFileManagerSwr();
    const { clearAndAddHttpError } = useFlashKey('files');

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const { clearFileUploads, removeFileUpload, pushFileUpload, setUploadProgress, setUploadBatchAbort } =
        ServerContext.useStoreActions((actions) => actions.files);

    useEffect(() => {
        folderUploadInput.current?.setAttribute('webkitdirectory', '');
    }, []);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                showDropdown.value = false;
            }
        };
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, []);

    const uploadFilesWithPaths = async (filesWithPaths: { file: File; relativePath: string }[]) => {
        clearAndAddHttpError();

        const batch = new AbortController();
        setUploadBatchAbort(batch);

        try {
            await uploadFilesToDirectory(
                uuid,
                directory,
                filesWithPaths,
                { pushFileUpload, removeFileUpload, setUploadProgress, clearFileUploads },
                batch.signal
            );
            onUploaded?.();
        } catch (error: unknown) {
            // A user-initiated cancellation is not an error worth surfacing.
            if (!axios.isCancel(error)) {
                clearFileUploads();
                clearAndAddHttpError(error instanceof Error ? error : String(error));
            }
        } finally {
            setUploadBatchAbort(null);
            // Refresh the listing so any files that finished before a cancel are shown.
            await mutate();
        }
    };

    return (
        <>
            <input
                type={'file'}
                ref={fileUploadInput}
                css={tw`hidden`}
                onChange={(e) => {
                    if (!e.currentTarget.files) return;
                    const list = Array.from(e.currentTarget.files);
                    void uploadFilesWithPaths(list.map((file) => ({ file, relativePath: file.name })));
                    e.currentTarget.value = '';
                }}
                multiple
            />
            <input
                type={'file'}
                ref={folderUploadInput}
                css={tw`hidden`}
                onChange={(e) => {
                    if (!e.currentTarget.files) return;
                    const list = Array.from(e.currentTarget.files);
                    void uploadFilesWithPaths(
                        list.map((file) => ({ file, relativePath: file.webkitRelativePath || file.name }))
                    );
                    e.currentTarget.value = '';
                }}
            />
            <div ref={dropdownRef} className={'relative'}>
                {iconOnly ? (
                    <ExplorerIconTooltip label={'Upload'}>
                        <button
                            type={'button'}
                            className={styles.explorer_icon_btn}
                            onClick={() => (showDropdown.value = !showDropdown.value)}
                        >
                            <CloudUploadIcon className={'w-4 h-4'} />
                        </button>
                    </ExplorerIconTooltip>
                ) : (
                    <Button className={className} onClick={() => (showDropdown.value = !showDropdown.value)}>
                        Upload
                    </Button>
                )}
                {showDropdown.value && (
                    <div
                        className={
                            iconOnly
                                ? 'absolute left-full top-0 ml-1 bg-neutral-800 border border-neutral-700 rounded shadow-lg z-50 min-w-max overflow-hidden'
                                : 'absolute right-0 top-full mt-1 bg-neutral-800 border border-neutral-700 rounded shadow-lg z-50 min-w-max overflow-hidden'
                        }
                    >
                        <button
                            className={
                                'flex items-center space-x-2 w-full px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-700'
                            }
                            onClick={() => {
                                showDropdown.value = false;
                                fileUploadInput.current?.click();
                            }}
                        >
                            <DocumentIcon className={'w-4 h-4'} />
                            <span>Files</span>
                        </button>
                        <button
                            className={
                                'flex items-center space-x-2 w-full px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-700'
                            }
                            onClick={() => {
                                showDropdown.value = false;
                                folderUploadInput.current?.click();
                            }}
                        >
                            <FolderIcon className={'w-4 h-4'} />
                            <span>Folder</span>
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};
