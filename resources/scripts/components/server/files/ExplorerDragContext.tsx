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

interface CollapseFolderHandler {
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
    handleDragLeave: (path: string) => void;
    handleDrop: (path: string, isFolder: boolean, dataTransfer: DataTransfer) => Promise<void>;
    registerExpandHandler: (handler: ExpandFolderHandler) => void;
    registerCollapseHandler: (handler: CollapseFolderHandler) => void;
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
    const collapseHandlerRef = useRef<CollapseFolderHandler | null>(null);
    const autoExpandedRef = useRef(new Set<string>());
    const expandTimersRef = useRef<Record<string, number>>({});
    const clearExpandTimers = useCallback(() => {
        Object.values(expandTimersRef.current).forEach((timer) => window.clearTimeout(timer));
        expandTimersRef.current = {};
    }, []);

    const collapseAutoExpanded = useCallback(() => {
        if (!collapseHandlerRef.current) {
            autoExpandedRef.current.clear();
            return;
        }

        autoExpandedRef.current.forEach((path) => collapseHandlerRef.current?.(path));
        autoExpandedRef.current.clear();
    }, []);

    const endDrag = useCallback(() => {
        setDragPath(null);
        setDropTarget(null);
        setIsExternalDrag(false);
        clearExpandTimers();
        collapseAutoExpanded();
    }, [clearExpandTimers, collapseAutoExpanded]);

    const beginInternalDrag = useCallback((payload: ExplorerDragPayload) => {
        setDragPath(cleanDirectoryPath(payload.path));
        setIsExternalDrag(false);
    }, []);

    const scheduleExpand = useCallback((folderPath: string) => {
        const normalized = cleanDirectoryPath(folderPath);

        if (expandTimersRef.current[normalized]) {
            return;
        }

        expandTimersRef.current[normalized] = window.setTimeout(() => {
            delete expandTimersRef.current[normalized];
            expandHandlerRef.current?.(normalized);
            autoExpandedRef.current.add(normalized);
        }, EXPLORER_DRAG_EXPAND_MS);
    }, []);

    const handleDragEnter = useCallback(
        (path: string, isFolder: boolean, dataTransfer?: DataTransfer) => {
            if (dataTransfer && hasExternalFiles(dataTransfer)) {
                setIsExternalDrag(true);
            }

            const folder = getDropFolderForPath(path, isFolder);
            setDropTarget(folder);
            scheduleExpand(folder);
        },
        [scheduleExpand]
    );

    const handleDragLeave = useCallback((path: string) => {
        const folder = cleanDirectoryPath(path);
        if (expandTimersRef.current[folder]) {
            window.clearTimeout(expandTimersRef.current[folder]);
            delete expandTimersRef.current[folder];
        }
    }, []);

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

                if (dataTransfer.files.length > 0) {
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

        return () => window.removeEventListener('dragend', onDragEnd);
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
            handleDragLeave,
            handleDrop,
            registerExpandHandler: (handler: ExpandFolderHandler) => {
                expandHandlerRef.current = handler;
            },
            registerCollapseHandler: (handler: CollapseFolderHandler) => {
                collapseHandlerRef.current = handler;
            },
        }),
        [
            beginInternalDrag,
            canCreate,
            canUpdate,
            dragPath,
            dropTarget,
            endDrag,
            handleDragEnter,
            handleDragLeave,
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
