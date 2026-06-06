import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';
import { join } from 'pathe';
import { useHistory } from 'react-router-dom';
import loadDirectory, { FileObject } from '@/api/server/files/loadDirectory';
import { cleanDirectoryPath, encodePathSegments } from '@/helpers';
import { ServerContext } from '@/state/server';
import { usePermissions } from '@/plugins/usePermissions';
import Spinner from '@/components/elements/Spinner';
import FileEditorPresenceAvatars from '@/components/server/files/FileEditorPresenceAvatars';
import FileTreeIcon from '@/components/server/files/FileTreeIcon';
import { FileEditorPresence } from '@/api/server/files/fileEditingPresence';
import { useExplorerDrag, writeInternalDragData } from '@/components/server/files/ExplorerDragContext';
import { getDropFolderForPath } from '@/components/server/files/fileExplorerDrag';
import { hasExternalFiles } from '@/components/server/files/fileUploadUtils';
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
    directory: string;
    activeFilePath: string | null;
    expandedPaths: Set<string>;
    loadingPaths: Set<string>;
    treeCache: Record<string, FileObject[]>;
    onToggleFolder: (path: string) => void;
    onNavigateDirectory: (path: string) => void;
    onOpenFile: (path: string, file: FileObject) => void;
    activeEditors: FileEditorPresence[];
    currentUserUuid?: string;
}

const TreeEntry = ({
    file,
    parentPath,
    depth,
    directory,
    activeFilePath,
    expandedPaths,
    loadingPaths,
    treeCache,
    onToggleFolder,
    onNavigateDirectory,
    onOpenFile,
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
        handleDragLeave,
        handleDrop,
    } = useExplorerDrag();

    const fullPath = join(parentPath, file.name);
    const isFolder = !file.isFile;
    const isExpanded = isFolder && expandedPaths.has(fullPath);
    const isLoading = isFolder && loadingPaths.has(fullPath);
    const isSelected = isFolder ? directory === fullPath : activeFilePath === fullPath;
    const children = isFolder ? treeCache[fullPath] : undefined;
    const showPresence = !isFolder && activeFilePath === fullPath;
    const dropFolder = getDropFolderForPath(fullPath, isFolder);
    const isDropTarget = dropTarget === dropFolder;
    const isDragging = dragPath === cleanDirectoryPath(fullPath);
    const canDrag = canUpdate;
    const canAcceptDrop = canUpdate || canCreate;

    const handleClick = () => {
        if (isFolder) {
            onNavigateDirectory(fullPath);
            if (!isExpanded) {
                onToggleFolder(fullPath);
            }
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
                onDragLeave={(event) => {
                    event.stopPropagation();
                    handleDragLeave(fullPath);
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
                            directory={directory}
                            activeFilePath={activeFilePath}
                            expandedPaths={expandedPaths}
                            loadingPaths={loadingPaths}
                            treeCache={treeCache}
                            onToggleFolder={onToggleFolder}
                            onNavigateDirectory={onNavigateDirectory}
                            onOpenFile={onOpenFile}
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
}

export default ({
    refreshToken,
    activeFilePath = null,
    activeEditors,
    currentUserUuid,
    onOpenFile,
}: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const history = useHistory();
    const [canRead] = usePermissions(['file.read']);

    const {
        dragPath,
        dropTarget,
        isExternalDrag,
        canUpdate,
        canCreate,
        endDrag,
        handleDragEnter,
        handleDragLeave,
        handleDrop,
        registerExpandHandler,
        registerCollapseHandler,
    } = useExplorerDrag();

    const [treeCache, setTreeCache] = useState<Record<string, FileObject[]>>({});
    const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['/']));
    const [loadingPaths, setLoadingPaths] = useState<Set<string>>(new Set());
    const [rootLoading, setRootLoading] = useState(true);
    const loadedPathsRef = useRef(new Set<string>());

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

    const collapseFolder = useCallback((path: string) => {
        const normalized = cleanDirectoryPath(path);

        setExpandedPaths((prev) => {
            const next = new Set(prev);
            next.delete(normalized);
            return next;
        });
    }, []);

    useEffect(() => {
        registerExpandHandler(expandFolder);
        registerCollapseHandler(collapseFolder);
    }, [collapseFolder, expandFolder, registerCollapseHandler, registerExpandHandler]);

    useEffect(() => {
        setRootLoading(true);
        fetchDirectory('/', true).finally(() => setRootLoading(false));
    }, [fetchDirectory]);

    useEffect(() => {
        if (refreshToken === undefined) {
            return;
        }

        loadedPathsRef.current.clear();
        const ancestors = getAncestorPaths(directory);
        ancestors.forEach((path) => {
            void fetchDirectory(path, true);
        });
    }, [refreshToken, directory, fetchDirectory]);

    useEffect(() => {
        const ancestors = getAncestorPaths(directory);
        setExpandedPaths((prev) => new Set([...prev, ...ancestors]));
        ancestors.forEach((path) => {
            void fetchDirectory(path);
        });
    }, [directory, fetchDirectory]);

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

    const onNavigateDirectory = useCallback(
        (path: string) => {
            history.push(`/server/${id}/files#${encodePathSegments(cleanDirectoryPath(path))}`);
        },
        [history, id]
    );

    const rootEntries = treeCache['/'] ?? [];
    const canAcceptDrop = canUpdate || canCreate;

    return (
        <div className={styles.explorer_tree}>
            <div
                className={classNames(styles.tree_body, isExternalDrag && styles.tree_body_external_drag)}
                onDragOver={(event) => {
                    if (!canAcceptDrop || !hasExternalFiles(event.dataTransfer)) {
                        return;
                    }

                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'copy';
                }}
                onDrop={(event) => {
                    if (!canAcceptDrop || !hasExternalFiles(event.dataTransfer)) {
                        return;
                    }

                    event.preventDefault();
                    void handleDrop(directory, true, event.dataTransfer);
                }}
            >
                {rootLoading ? (
                    <div className={'py-6'}>
                        <Spinner size={'small'} centered />
                    </div>
                ) : !canRead ? (
                    <p className={'text-xs text-neutral-500 px-3 py-2 m-0'}>No permission to browse files.</p>
                ) : (
                    <>
                        <button
                            type={'button'}
                            onClick={() => onNavigateDirectory('/')}
                            onDragOver={(event) => {
                                if (!canAcceptDrop) {
                                    return;
                                }

                                event.preventDefault();
                                event.stopPropagation();
                                event.dataTransfer.dropEffect = event.dataTransfer.types.includes(
                                    'application/x-realm-explorer-path'
                                )
                                    ? 'move'
                                    : 'copy';
                            }}
                            onDragEnter={(event) => {
                                if (!canAcceptDrop) {
                                    return;
                                }

                                event.preventDefault();
                                event.stopPropagation();
                                handleDragEnter('/', true, event.dataTransfer);
                            }}
                            onDragLeave={(event) => {
                                event.stopPropagation();
                                handleDragLeave('/');
                            }}
                            onDrop={(event) => {
                                if (!canAcceptDrop) {
                                    return;
                                }

                                event.preventDefault();
                                event.stopPropagation();
                                void handleDrop('/', true, event.dataTransfer);
                            }}
                            className={classNames(
                                styles.tree_row,
                                directory === '/' && styles.tree_row_active,
                                dropTarget === '/' && styles.tree_row_drop_target
                            )}
                            style={{ paddingLeft: '8px' }}
                        >
                            <span
                                className={styles.tree_chevron}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onToggleFolder('/');
                                }}
                            >
                                <FontAwesomeIcon
                                    icon={expandedPaths.has('/') ? faChevronDown : faChevronRight}
                                    className={'text-[10px]'}
                                />
                            </span>
                            <FileTreeIcon name={'container'} expanded={expandedPaths.has('/')} isRoot />
                            <span className={styles.tree_label}>container</span>
                        </button>
                        {expandedPaths.has('/') &&
                            rootEntries.map((file) => (
                                <TreeEntry
                                    key={file.key}
                                    file={file}
                                    parentPath={'/'}
                                    depth={1}
                                    directory={directory}
                                    activeFilePath={activeFilePath}
                                    expandedPaths={expandedPaths}
                                    loadingPaths={loadingPaths}
                                    treeCache={treeCache}
                                    onToggleFolder={onToggleFolder}
                                    onNavigateDirectory={onNavigateDirectory}
                                    onOpenFile={onOpenFile}
                                    activeEditors={activeEditors}
                                    currentUserUuid={currentUserUuid}
                                />
                            ))}
                    </>
                )}
            </div>
            {(dragPath || isExternalDrag) && (
                <div className={styles.tree_drop_hint}>
                    {isExternalDrag ? 'Drop to upload into folder' : 'Drop to move'}
                </div>
            )}
        </div>
    );
};
