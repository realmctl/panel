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
    const fullPath = join(parentPath, file.name);
    const isFolder = !file.isFile;
    const isExpanded = isFolder && expandedPaths.has(fullPath);
    const isLoading = isFolder && loadingPaths.has(fullPath);
    const isSelected = isFolder ? directory === fullPath : activeFilePath === fullPath;
    const children = isFolder ? treeCache[fullPath] : undefined;
    const showPresence = !isFolder && activeFilePath === fullPath;

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
                onClick={handleClick}
                className={classNames(styles.tree_row, isSelected && styles.tree_row_active)}
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

    useEffect(() => {
        setRootLoading(true);
        fetchDirectory('/', true).finally(() => setRootLoading(false));
    }, [fetchDirectory]);

    useEffect(() => {
        if (refreshToken === undefined) {
            return;
        }

        const normalized = cleanDirectoryPath(directory);
        loadedPathsRef.current.delete(normalized);
        void fetchDirectory(normalized, true);
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

    return (
        <div className={styles.explorer_tree}>
            <div className={styles.tree_body}>
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
                            className={classNames(styles.tree_row, directory === '/' && styles.tree_row_active)}
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
        </div>
    );
};
