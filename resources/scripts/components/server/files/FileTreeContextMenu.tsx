import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBoxOpen,
    faCopy,
    faExternalLinkAlt,
    faFileArchive,
    faFileCode,
    faFileDownload,
    faFolderPlus,
    faHistory,
    faLevelUpAlt,
    faPencilAlt,
    faPlus,
    faTrashAlt,
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { join } from 'pathe';
import { FileObject } from '@/api/server/files/loadDirectory';
import { cleanDirectoryPath } from '@/helpers';
import { ServerContext } from '@/state/server';
import Can from '@/components/elements/Can';
import useFlash from '@/plugins/useFlash';
import deleteFiles from '@/api/server/files/deleteFiles';
import copyFile from '@/api/server/files/copyFile';
import getFileDownloadUrl from '@/api/server/files/getFileDownloadUrl';
import compressFiles from '@/api/server/files/compressFiles';
import decompressFiles from '@/api/server/files/decompressFiles';
import RenameFileModal from '@/components/server/files/RenameFileModal';
import ChmodFileModal from '@/components/server/files/ChmodFileModal';
import FileRevisionModal from '@/components/server/files/FileRevisionModal';
import { Dialog } from '@/components/elements/dialog';
import { usePermissions } from '@/plugins/usePermissions';
import { canOpenInEditor } from '@/components/server/files/fileMediaUtils';
import styles from './style.module.css';

export interface FileTreeContextTarget {
    file: FileObject;
    parentPath: string;
    x: number;
    y: number;
}

export interface RootTreeContextTarget {
    parentPath: string;
    x: number;
    y: number;
}

export type TreeContextTarget = FileTreeContextTarget | RootTreeContextTarget;

const isFileTarget = (target: TreeContextTarget): target is FileTreeContextTarget => 'file' in target;

type ModalType = 'rename' | 'move' | 'chmod';

interface MenuItemProps {
    icon: IconDefinition;
    label: string;
    onClick: () => void;
    danger?: boolean;
}

const MenuItem = ({ icon, label, onClick, danger }: MenuItemProps) => (
    <button type={'button'} className={danger ? styles.context_menu_item_danger : styles.context_menu_item} onClick={onClick}>
        <FontAwesomeIcon icon={icon} className={'w-3 text-neutral-500'} fixedWidth />
        <span>{label}</span>
    </button>
);

interface Props {
    target: TreeContextTarget | null;
    onClose: () => void;
    onOpenFile?: (path: string, file: FileObject) => void;
    onNewFile?: () => void;
    onNewFolder?: () => void;
    onTreeChange?: () => void;
    onItemMoved?: (from: string, to: string) => void;
    onItemDeleted?: (path: string) => void;
}

export default ({
    target,
    onClose,
    onOpenFile,
    onNewFile,
    onNewFolder,
    onTreeChange,
    onItemMoved,
    onItemDeleted,
}: Props) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { clearAndAddHttpError, clearFlashes } = useFlash();
    const [canReadContents] = usePermissions(['file.read-content']);

    const [menuVisible, setMenuVisible] = useState(true);
    const [modal, setModal] = useState<ModalType | null>(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showRevisions, setShowRevisions] = useState(false);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (target) {
            setMenuVisible(true);
            setModal(null);
            setShowConfirmation(false);
            setShowRevisions(false);
        }
    }, [target]);

    const dismiss = () => {
        setMenuVisible(false);
        onClose();
    };

    const hideMenu = () => setMenuVisible(false);

    useEffect(() => {
        if (!target || !menuVisible) {
            return;
        }

        const close = () => dismiss();

        const onPointerDown = (event: MouseEvent) => {
            if (menuRef.current?.contains(event.target as Node)) {
                return;
            }

            close();
        };

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                close();
            }
        };

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('contextmenu', close);
        document.addEventListener('scroll', close, true);
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('contextmenu', close);
            document.removeEventListener('scroll', close, true);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [target, menuVisible, onClose]);

    useEffect(() => {
        if (!target || !menuVisible || !menuRef.current) {
            return;
        }

        const menu = menuRef.current;
        const rect = menu.getBoundingClientRect();
        let x = target.x;
        let y = target.y;

        if (x + rect.width > window.innerWidth - 8) {
            x = Math.max(8, window.innerWidth - rect.width - 8);
        }

        if (y + rect.height > window.innerHeight - 8) {
            y = Math.max(8, window.innerHeight - rect.height - 8);
        }

        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
    }, [target, menuVisible]);

    if (!target) {
        return null;
    }

    const parentPath = cleanDirectoryPath(target.parentPath);
    const file = isFileTarget(target) ? target.file : null;
    const fullPath = file ? cleanDirectoryPath(join(parentPath, file.name)) : parentPath;

    const openModal = (type: ModalType) => {
        hideMenu();
        setModal(type);
    };

    const runAction = (action: () => Promise<void>) => {
        dismiss();
        setBusy(true);
        clearFlashes('files');

        action()
            .then(() => onTreeChange?.())
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setBusy(false));
    };

    const doDeletion = () => {
        if (!file) {
            return;
        }

        setShowConfirmation(false);
        dismiss();
        setBusy(true);
        clearFlashes('files');

        deleteFiles(uuid, parentPath, [file.name])
            .then(() => {
                onItemDeleted?.(fullPath);
                onTreeChange?.();
            })
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setBusy(false));
    };

    const menu = menuVisible ? (
        <div ref={menuRef} className={styles.context_menu} style={{ left: target.x, top: target.y }}>
            {file ? (
                <>
                    {file.isFile && canOpenInEditor(file) && canReadContents && onOpenFile && (
                        <>
                            <MenuItem
                                icon={faExternalLinkAlt}
                                label={'Open'}
                                onClick={() => {
                                    dismiss();
                                    onOpenFile(fullPath, file);
                                }}
                            />
                            <div className={styles.context_menu_divider} />
                        </>
                    )}
                    <Can action={'file.update'}>
                        <MenuItem icon={faPencilAlt} label={'Rename'} onClick={() => openModal('rename')} />
                        <MenuItem icon={faLevelUpAlt} label={'Move'} onClick={() => openModal('move')} />
                        <MenuItem icon={faFileCode} label={'Permissions'} onClick={() => openModal('chmod')} />
                    </Can>
                    {file.isFile && (
                        <Can action={'file.create'}>
                            <MenuItem
                                icon={faCopy}
                                label={'Copy'}
                                onClick={() => runAction(() => copyFile(uuid, fullPath))}
                            />
                        </Can>
                    )}
                    {file.isArchiveType() ? (
                        <Can action={'file.create'}>
                            <MenuItem
                                icon={faBoxOpen}
                                label={'Unarchive'}
                                onClick={() => runAction(() => decompressFiles(uuid, parentPath, file.name))}
                            />
                        </Can>
                    ) : (
                        <Can action={'file.archive'}>
                            <MenuItem
                                icon={faFileArchive}
                                label={'Archive'}
                                onClick={() => runAction(() => compressFiles(uuid, parentPath, [file.name]))}
                            />
                        </Can>
                    )}
                    {file.isFile && (
                        <MenuItem
                            icon={faFileDownload}
                            label={'Download'}
                            onClick={() =>
                                runAction(() =>
                                    getFileDownloadUrl(uuid, fullPath).then((url) => {
                                        window.location.href = url;
                                    })
                                )
                            }
                        />
                    )}
                    {file.isFile && (
                        <Can action={'file.revision-read'}>
                            <MenuItem
                                icon={faHistory}
                                label={'History'}
                                onClick={() => {
                                    hideMenu();
                                    setShowRevisions(true);
                                }}
                            />
                        </Can>
                    )}
                    <Can action={'file.delete'}>
                        <div className={styles.context_menu_divider} />
                        <MenuItem
                            icon={faTrashAlt}
                            label={'Delete'}
                            danger
                            onClick={() => {
                                hideMenu();
                                setShowConfirmation(true);
                            }}
                        />
                    </Can>
                </>
            ) : (
                <Can action={'file.create'}>
                    <MenuItem
                        icon={faPlus}
                        label={'New file'}
                        onClick={() => {
                            dismiss();
                            onNewFile?.();
                        }}
                    />
                    <MenuItem
                        icon={faFolderPlus}
                        label={'New folder'}
                        onClick={() => {
                            dismiss();
                            onNewFolder?.();
                        }}
                    />
                </Can>
            )}
        </div>
    ) : null;

    return (
        <>
            {menu && createPortal(menu, document.body)}
            {busy && <div className={styles.context_menu_overlay} />}
            {file && (
                <>
                    <Dialog.Confirm
                        open={showConfirmation}
                        onClose={() => {
                            setShowConfirmation(false);
                            dismiss();
                        }}
                        title={`Delete ${file.isFile ? 'file' : 'folder'}`}
                        confirm={'Delete'}
                        onConfirmed={doDeletion}
                    >
                        You will not be able to recover the contents of{' '}
                        <span className={'font-semibold text-gray-50'}>{file.name}</span> once deleted.
                    </Dialog.Confirm>
                    {file.isFile && (
                        <FileRevisionModal
                            visible={showRevisions}
                            filePath={fullPath}
                            onDismissed={() => {
                                setShowRevisions(false);
                                dismiss();
                            }}
                            onRestored={onTreeChange}
                        />
                    )}
                    {modal === 'chmod' ? (
                        <ChmodFileModal
                            visible
                            appear
                            directory={parentPath}
                            files={[{ file: file.name, mode: file.modeBits }]}
                            onDismissed={() => {
                                setModal(null);
                                dismiss();
                            }}
                            onCompleted={onTreeChange}
                        />
                    ) : modal ? (
                        <RenameFileModal
                            visible
                            appear
                            directory={parentPath}
                            files={[file.name]}
                            useMoveTerminology={modal === 'move'}
                            onDismissed={() => {
                                setModal(null);
                                dismiss();
                            }}
                            onCompleted={(from, to) => {
                                onItemMoved?.(cleanDirectoryPath(join(parentPath, from)), cleanDirectoryPath(join(parentPath, to)));
                                onTreeChange?.();
                            }}
                        />
                    ) : null}
                </>
            )}
        </>
    );
};
