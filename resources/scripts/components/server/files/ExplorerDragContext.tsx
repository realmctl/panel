import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import renameFiles from '@/api/server/files/renameFiles';
import { httpErrorToHuman } from '@/api/http';
import { cleanDirectoryPath } from '@/helpers';
import { join } from 'pathe';
import { getFileName } from '@/components/server/files/fileEditorUtils';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';
import {
    collectFilesFromDataTransfer,
    hasExternalFiles,
    uploadFilesToDirectory,
} from '@/components/server/files/fileUploadUtils';
import {
    buildMoveRenamePayload,
    canMoveIntoFolder,
    EXPLORER_DRAG_EXPAND_MS,
    EXPLORER_DRAG_MIME,
    ExplorerDragPayload,
    getDropFolderForPath,
    readExplorerDragPayload,
} from '@/components/server/files/fileExplorerDrag';

interface ExpandFolderHandler {
    (path: string): void;
}

interface ContextValue {
    dragPath: string | null;
    dropTarget: string | null;
    isExternalDrag: boolean;
    canUpdate: boolean;
    canCreate: boolean;
    beginInternalDrag: (payload: ExplorerDragPayload) => void;
    endDrag: () => void;
    handleDragEnter: (path: string, isFolder: boolean, dataTransfer?: DataTransfer) => void;
    clearHoverTarget: () => void;
    handleDrop: (path: string, isFolder: boolean, dataTransfer: DataTransfer) => Promise<void>;
    registerExpandHandler: (handler: ExpandFolderHandler) => void;
}

const ExplorerDragContext = createContext<ContextValue | null>(null);

export const useExplorerDrag = () => {
    const context = useContext(ExplorerDragContext);

    if (!context) {
        throw new Error('useExplorerDrag must be used within ExplorerDragProvider');
    }

    return context;
};

interface ProviderProps {
    canUpdate: boolean;
    canCreate: boolean;
    onTreeChange: () => void;
    onItemMoved?: (from: string, to: string) => void;
    children: React.ReactNode;
}

export const ExplorerDragProvider = ({ canUpdate, canCreate, onTreeChange, onItemMoved, children }: ProviderProps) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { clearFileUploads, removeFileUpload, pushFileUpload, setUploadProgress } = ServerContext.useStoreActions(
        (actions) => actions.files
    );
    const { clearAndAddHttpError, clearFlashes } = useFlash();

    const [dragPath, setDragPath] = useState<string | null>(null);
    const [dropTarget, setDropTarget] = useState<string | null>(null);
    const [isExternalDrag, setIsExternalDrag] = useState(false);

    const expandHandlerRef = useRef<ExpandFolderHandler | null>(null);
    // The folder the cursor is currently hovering over. Tracking a single folder keeps
    // the spring-open timer stable: moving between elements inside the same row no longer
    // resets it, and only a real change in target restarts the countdown.
    const hoverFolderRef = useRef<string | null>(null);
    const expandTimerRef = useRef<number | null>(null);

    const clearExpandTimer = useCallback(() => {
        if (expandTimerRef.current !== null) {
            window.clearTimeout(expandTimerRef.current);
            expandTimerRef.current = null;
        }
    }, []);

    const endDrag = useCallback(() => {
        clearExpandTimer();
        hoverFolderRef.current = null;
        setDragPath(null);
        setDropTarget(null);
        setIsExternalDrag(false);
    }, [clearExpandTimer]);

    const clearHoverTarget = useCallback(() => {
        clearExpandTimer();
        hoverFolderRef.current = null;
        setDropTarget(null);
        setIsExternalDrag(false);
    }, [clearExpandTimer]);

    const beginInternalDrag = useCallback((payload: ExplorerDragPayload) => {
        setDragPath(cleanDirectoryPath(payload.path));
        setIsExternalDrag(false);
    }, []);

    const handleDragEnter = useCallback(
        (path: string, isFolder: boolean, dataTransfer?: DataTransfer) => {
            if (dataTransfer && hasExternalFiles(dataTransfer)) {
                setIsExternalDrag(true);
            }

            const folder = getDropFolderForPath(path, isFolder);

            // Already hovering this folder – do nothing so the spring-open timer keeps running.
            if (hoverFolderRef.current === folder) {
                return;
            }

            hoverFolderRef.current = folder;
            setDropTarget(folder);

            clearExpandTimer();
            expandTimerRef.current = window.setTimeout(() => {
                expandTimerRef.current = null;
                // Spring-open the folder and leave it open – folders never auto-collapse,
                // which avoids the tree jumping around mid-drag.
                expandHandlerRef.current?.(folder);
            }, EXPLORER_DRAG_EXPAND_MS);
        },
        [clearExpandTimer]
    );

    const moveItem = useCallback(
        async (sourcePath: string, targetFolder: string) => {
            if (!canUpdate) {
                return;
            }

            if (!canMoveIntoFolder(sourcePath, targetFolder)) {
                return;
            }

            const payload = buildMoveRenamePayload(sourcePath, targetFolder);
            await renameFiles(uuid, payload.root, payload.files);
            const destination = cleanDirectoryPath(
                join(cleanDirectoryPath(targetFolder), getFileName(cleanDirectoryPath(sourcePath)))
            );
            onItemMoved?.(cleanDirectoryPath(sourcePath), destination);
            onTreeChange();
        },
        [canUpdate, onItemMoved, onTreeChange, uuid]
    );

    const uploadToFolder = useCallback(
        async (targetFolder: string, dataTransfer: DataTransfer) => {
            if (!canCreate) {
                return;
            }

            const files = await collectFilesFromDataTransfer(dataTransfer.items);
            if (files.length === 0) {
                return;
            }

            clearFlashes('files');
            await uploadFilesToDirectory(uuid, targetFolder, files, {
                pushFileUpload,
                removeFileUpload,
                setUploadProgress,
                clearFileUploads,
            });
            onTreeChange();
        },
        [canCreate, clearFileUploads, clearFlashes, onTreeChange, pushFileUpload, removeFileUpload, setUploadProgress, uuid]
    );

    const handleDrop = useCallback(
        async (path: string, isFolder: boolean, dataTransfer: DataTransfer) => {
            const targetFolder = getDropFolderForPath(path, isFolder);
            const internal = readExplorerDragPayload(dataTransfer);

            try {
                if (internal) {
                    await moveItem(internal.path, targetFolder);
                    return;
                }

                if (dataTransfer.files.length > 0 || hasExternalFiles(dataTransfer)) {
                    await uploadToFolder(targetFolder, dataTransfer);
                }
            } catch (error) {
                console.error(error);
                clearAndAddHttpError({ key: 'files', error: httpErrorToHuman(error) });
            } finally {
                endDrag();
            }
        },
        [clearAndAddHttpError, endDrag, moveItem, uploadToFolder]
    );

    useEffect(() => {
        const onDragEnd = () => endDrag();
        window.addEventListener('dragend', onDragEnd);
        window.addEventListener('drop', onDragEnd);

        return () => {
            window.removeEventListener('dragend', onDragEnd);
            window.removeEventListener('drop', onDragEnd);
        };
    }, [endDrag]);

    const value = useMemo(
        () => ({
            dragPath,
            dropTarget,
            isExternalDrag,
            canUpdate,
            canCreate,
            beginInternalDrag,
            endDrag,
            handleDragEnter,
            clearHoverTarget,
            handleDrop,
            registerExpandHandler: (handler: ExpandFolderHandler) => {
                expandHandlerRef.current = handler;
            },
        }),
        [
            beginInternalDrag,
            canCreate,
            canUpdate,
            clearHoverTarget,
            dragPath,
            dropTarget,
            endDrag,
            handleDragEnter,
            handleDrop,
            isExternalDrag,
        ]
    );

    return <ExplorerDragContext.Provider value={value}>{children}</ExplorerDragContext.Provider>;
};

export const writeInternalDragData = (dataTransfer: DataTransfer, payload: ExplorerDragPayload) => {
    dataTransfer.setData(EXPLORER_DRAG_MIME, JSON.stringify(payload));
    dataTransfer.effectAllowed = 'move';
};
