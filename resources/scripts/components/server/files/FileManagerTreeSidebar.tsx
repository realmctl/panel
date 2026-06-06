import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';
import { dirname, join } from 'pathe';
import loadDirectory, { FileObject } from '@/api/server/files/loadDirectory';
import { cleanDirectoryPath } from '@/helpers';
import { ServerContext } from '@/state/server';
import { usePermissions } from '@/plugins/usePermissions';
import Spinner from '@/components/elements/Spinner';
import FileEditorPresenceAvatars from '@/components/server/files/FileEditorPresenceAvatars';
import FileTreeIcon from '@/components/server/files/FileTreeIcon';
import { FileEditorPresence } from '@/api/server/files/fileEditingPresence';
import { useExplorerDrag, writeInternalDragData } from '@/components/server/files/ExplorerDragContext';
import { getDropFolderForPath } from '@/components/server/files/fileExplorerDrag';
import { hasExternalFiles } from '@/components/server/files/fileUploadUtils';
import FileTreeContextMenu, { TreeContextTarget } from '@/components/server/files/FileTreeContextMenu';
import styles from './style.module.css';

const sortTreeEntries = (entries: FileObject[]) =>
    [...entries]
        .sort((a, b) => a.name.localeCompare(b.name))
        .sort((a, b) => (a.isFile === b.isFile ? 0 : a.isFile ? 1 : -1));

const getAncestorPaths = (path: string): string[] => {
    const normalized = cleanDirectoryPath(path);
    if (normalized === '/') {
        return ['/'];
    }

    const parts = normalized.split('/').filter(Boolean);
    const paths = ['/'];

    let current = '';
    for (const part of parts) {
        current = `${current}/${part}`;
        paths.push(current);
    }

    return paths;
};

interface TreeEntryProps {
    file: FileObject;
    parentPath: string;
    depth: number;
    activeFilePath: string | null;
    expandedPaths: Set<string>;
    loadingPaths: Set<string>;
    treeCache: Record<string, FileObject[]>;
    onToggleFolder: (path: string) => void;
    onOpenFile: (path: string, file: FileObject) => void;
    onContextMenu: (event: React.MouseEvent, file: FileObject, parentPath: string) => void;
    activeEditors: FileEditorPresence[];
    currentUserUuid?: string;
}

const TreeEntry = ({
    file,
    parentPath,
    depth,
    activeFilePath,
    expandedPaths,
    loadingPaths,
    treeCache,
    onToggleFolder,
    onOpenFile,
    onContextMenu,
    activeEditors,
    currentUserUuid,
}: TreeEntryProps) => {
    const {
        dragPath,
        dropTarget,
        canUpdate,
        canCreate,
        beginInternalDrag,
        endDrag,
        handleDragEnter,
        handleDrop,
    } = useExplorerDrag();

    const fullPath = join(parentPath, file.name);
    const isFolder = !file.isFile;
    const isExpanded = isFolder && expandedPaths.has(fullPath);
    const isLoading = isFolder && loadingPaths.has(fullPath);
    const isSelected = !isFolder && activeFilePath === fullPath;
    const children = isFolder ? treeCache[fullPath] : undefined;
    const showPresence = !isFolder && activeFilePath === fullPath;
    const dropFolder = getDropFolderForPath(fullPath, isFolder);
    const isDropTarget = dropTarget === dropFolder;
    const isDragging = dragPath === cleanDirectoryPath(fullPath);
    const canDrag = canUpdate;
    const canAcceptDrop = canUpdate || canCreate;

    const handleClick = () => {
        if (isFolder) {
            onToggleFolder(fullPath);
            return;
        }

        onOpenFile(fullPath, file);
    };

    const handleChevronClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        if (isFolder) {
            onToggleFolder(fullPath);
        }
    };

    return (
        <div>
            <button
                type={'button'}
                draggable={canDrag}
                onClick={handleClick}
                onContextMenu={(event) => onContextMenu(event, file, parentPath)}
                onDragStart={(event) => {
                    if (!canDrag) {
                        event.preventDefault();
                        return;
                    }

                    writeInternalDragData(event.dataTransfer, { path: fullPath, isFile: file.isFile });
                    beginInternalDrag({ path: fullPath, isFile: file.isFile });
                }}
                onDragEnd={() => endDrag()}
                onDragOver={(event) => {
                    if (!canAcceptDrop) {
                        return;
                    }

                    event.preventDefault();
                    event.stopPropagation();
                    event.dataTransfer.dropEffect = event.dataTransfer.types.includes('application/x-realm-explorer-path')
                        ? 'move'
                        : 'copy';
                }}
                onDragEnter={(event) => {
                    if (!canAcceptDrop) {
                        return;
                    }

                    event.preventDefault();
                    event.stopPropagation();
                    handleDragEnter(fullPath, isFolder, event.dataTransfer);
                }}
                onDrop={(event) => {
                    if (!canAcceptDrop) {
                        return;
                    }

                    event.preventDefault();
                    event.stopPropagation();
                    void handleDrop(fullPath, isFolder, event.dataTransfer);
                }}
                className={classNames(
                    styles.tree_row,
                    isSelected && styles.tree_row_active,
                    isDragging && styles.tree_row_dragging,
                    isDropTarget && styles.tree_row_drop_target
                )}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
                title={file.name}
            >
                <span className={styles.tree_chevron} onClick={handleChevronClick}>
                    {isFolder ? (
                        isLoading ? (
                            <Spinner size={'small'} />
                        ) : (
                            <FontAwesomeIcon icon={isExpanded ? faChevronDown : faChevronRight} className={'text-[10px]'} />
                        )
                    ) : (
                        <span className={'inline-block w-2.5'} />
                    )}
                </span>
                {showPresence && (
                    <FileEditorPresenceAvatars editors={activeEditors} currentUserUuid={currentUserUuid} />
                )}
                <FileTreeIcon
                    name={file.name}
                    isFile={file.isFile}
                    isSymlink={file.isSymlink}
                    isArchive={file.isArchiveType()}
                    expanded={isExpanded}
                />
                <span className={styles.tree_label}>{file.name}</span>
            </button>
            {isFolder && isExpanded && children && children.length > 0 && (
                <div>
                    {children.map((child) => (
                        <TreeEntry
                            key={`${fullPath}/${child.name}`}
                            file={child}
                            parentPath={fullPath}
                            depth={depth + 1}
                            activeFilePath={activeFilePath}
                            expandedPaths={expandedPaths}
                            loadingPaths={loadingPaths}
                            treeCache={treeCache}
                            onToggleFolder={onToggleFolder}
                            onOpenFile={onOpenFile}
                            onContextMenu={onContextMenu}
                            activeEditors={activeEditors}
                            currentUserUuid={currentUserUuid}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

interface Props {
    refreshToken?: unknown;
    activeFilePath?: string | null;
    activeEditors: FileEditorPresence[];
    currentUserUuid?: string;
    onOpenFile: (path: string, file: FileObject) => void;
    onTreeChange?: () => void;
    onNewFile?: () => void;
    onNewFolder?: () => void;
    onItemMoved?: (from: string, to: string) => void;
    onItemDeleted?: (path: string) => void;
}

export default ({
    refreshToken,
    activeFilePath = null,
    activeEditors,
    currentUserUuid,
    onOpenFile,
    onTreeChange,
    onNewFile,
    onNewFolder,
    onItemMoved,
    onItemDeleted,
}: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const [canRead] = usePermissions(['file.read']);

    const {
        dragPath,
        dropTarget,
        isExternalDrag,
        canUpdate,
        canCreate,
        handleDragEnter,
        clearHoverTarget,
        handleDrop,
        registerExpandHandler,
    } = useExplorerDrag();

    const [treeCache, setTreeCache] = useState<Record<string, FileObject[]>>({});
    const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['/']));
    const [loadingPaths, setLoadingPaths] = useState<Set<string>>(new Set());
    const [rootLoading, setRootLoading] = useState(true);
    const [contextMenu, setContextMenu] = useState<TreeContextTarget | null>(null);
    const loadedPathsRef = useRef(new Set<string>());

    const openContextMenu = useCallback((event: React.MouseEvent, file: FileObject, parentPath: string) => {
        event.preventDefault();
        event.stopPropagation();
        setContextMenu({ file, parentPath: cleanDirectoryPath(parentPath), x: event.clientX, y: event.clientY });
    }, []);

    const openRootContextMenu = useCallback((event: React.MouseEvent, parentPath: string) => {
        event.preventDefault();
        event.stopPropagation();
        setContextMenu({ parentPath: cleanDirectoryPath(parentPath), x: event.clientX, y: event.clientY });
    }, []);

    const fetchDirectory = useCallback(
        async (path: string, force = false) => {
            const normalized = cleanDirectoryPath(path);

            if (!force && loadedPathsRef.current.has(normalized)) {
                return;
            }

            setLoadingPaths((prev) => new Set(prev).add(normalized));

            try {
                const data = sortTreeEntries(await loadDirectory(uuid, normalized));
                loadedPathsRef.current.add(normalized);
                setTreeCache((prev) => ({ ...prev, [normalized]: data }));
            } catch (error) {
                console.error(error);
                loadedPathsRef.current.add(normalized);
                setTreeCache((prev) => ({ ...prev, [normalized]: [] }));
            } finally {
                setLoadingPaths((prev) => {
                    const next = new Set(prev);
                    next.delete(normalized);
                    return next;
                });
            }
        },
        [uuid]
    );

    const expandFolder = useCallback(
        (path: string) => {
            const normalized = cleanDirectoryPath(path);

            setExpandedPaths((prev) => new Set([...prev, normalized]));

            if (!loadedPathsRef.current.has(normalized)) {
                void fetchDirectory(normalized);
            }
        },
        [fetchDirectory]
    );

    useEffect(() => {
        registerExpandHandler(expandFolder);
    }, [expandFolder, registerExpandHandler]);

    useEffect(() => {
        setRootLoading(true);
        fetchDirectory('/', true).finally(() => setRootLoading(false));
    }, [fetchDirectory]);

    useEffect(() => {
        if (refreshToken === undefined) {
            return;
        }

        loadedPathsRef.current.clear();
        const ancestors = activeFilePath ? getAncestorPaths(dirname(activeFilePath)) : ['/'];
        ancestors.forEach((path) => {
            void fetchDirectory(path, true);
        });
    }, [refreshToken, activeFilePath, fetchDirectory]);

    useEffect(() => {
        if (!activeFilePath) {
            return;
        }

        const ancestors = getAncestorPaths(dirname(activeFilePath));
        setExpandedPaths((prev) => new Set([...prev, ...ancestors]));
        ancestors.forEach((path) => {
            void fetchDirectory(path);
        });
    }, [activeFilePath, fetchDirectory]);

    const onToggleFolder = useCallback(
        (path: string) => {
            const normalized = cleanDirectoryPath(path);

            setExpandedPaths((prev) => {
                const next = new Set(prev);
                if (next.has(normalized)) {
                    next.delete(normalized);
                } else {
                    next.add(normalized);
                }
                return next;
            });

            if (!loadedPathsRef.current.has(normalized)) {
                void fetchDirectory(normalized);
            }
        },
        [fetchDirectory]
    );

    const rootEntries = treeCache['/'] ?? [];
    const canAcceptDrop = canUpdate || canCreate;

    return (
        <div className={styles.explorer_tree}>
            <div
                className={classNames(
                    styles.tree_body,
                    (isExternalDrag || dropTarget === cleanDirectoryPath(directory)) && styles.tree_body_external_drag
                )}
                onDragOver={(event) => {
                    if (!canAcceptDrop) {
                        return;
                    }

                    event.preventDefault();
                    event.dataTransfer.dropEffect = hasExternalFiles(event.dataTransfer)
                        ? 'copy'
                        : event.dataTransfer.types.includes('application/x-realm-explorer-path')
                          ? 'move'
                          : 'copy';
                }}
                onDragLeave={(event) => {
                    // Only clear the highlight when the cursor actually leaves the whole
                    // tree, not when moving between rows inside it.
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                        clearHoverTarget();
                    }
                }}
                onDrop={(event) => {
                    if (!canAcceptDrop) {
                        return;
                    }

                    event.preventDefault();
                    void handleDrop(directory, true, event.dataTransfer);
                }}
                onDragEnter={(event) => {
                    if (!canAcceptDrop) {
                        return;
                    }

                    event.preventDefault();
                    handleDragEnter(directory, true, event.dataTransfer);
                }}
                onContextMenu={(event) => openRootContextMenu(event, directory)}
            >
                {rootLoading ? (
                    <div className={'py-6'}>
                        <Spinner size={'small'} centered />
                    </div>
                ) : !canRead ? (
                    <p className={'text-xs text-neutral-500 px-3 py-2 m-0'}>No permission to browse files.</p>
                ) : rootEntries.length === 0 ? (
                    <p className={'text-xs text-neutral-500 px-3 py-2 m-0'}>This directory is empty.</p>
                ) : (
                    rootEntries.map((file) => (
                        <TreeEntry
                            key={file.key}
                            file={file}
                            parentPath={'/'}
                            depth={0}
                            activeFilePath={activeFilePath}
                            expandedPaths={expandedPaths}
                            loadingPaths={loadingPaths}
                            treeCache={treeCache}
                            onToggleFolder={onToggleFolder}
                            onOpenFile={onOpenFile}
                            onContextMenu={openContextMenu}
                            activeEditors={activeEditors}
                            currentUserUuid={currentUserUuid}
                        />
                    ))
                )}
            </div>
            <FileTreeContextMenu
                target={contextMenu}
                onClose={() => setContextMenu(null)}
                onOpenFile={onOpenFile}
                onNewFile={onNewFile}
                onNewFolder={onNewFolder}
                onTreeChange={onTreeChange}
                onItemMoved={onItemMoved}
                onItemDeleted={onItemDeleted}
            />
            {(dragPath || isExternalDrag) && (
                <div className={styles.tree_drop_hint}>
                    {isExternalDrag ? 'Drop to upload into folder' : 'Drop to move'}
                </div>
            )}
        </div>
    );
};
