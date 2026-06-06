import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import getFileContents from '@/api/server/files/getFileContents';
import { httpErrorToHuman } from '@/api/http';
import { FileObject } from '@/api/server/files/loadDirectory';
import FileManagerTreeSidebar from '@/components/server/files/FileManagerTreeSidebar';
import FileManagerExplorerToolbar from '@/components/server/files/FileManagerExplorerToolbar';
import FileEditorWorkspace from '@/components/server/files/FileEditorWorkspace';
import FileNameModal from '@/components/server/files/FileNameModal';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import RealmCard from '@/components/elements/realm/RealmCard';
import { useStoreActions } from '@/state/hooks';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import { cleanDirectoryPath, encodePathSegments, hashToPath } from '@/helpers';
import { dirname, join } from 'pathe';
import { ServerContext } from '@/state/server';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import { detectModeFromFilename, getFileName, OpenFileTab } from '@/components/server/files/fileEditorUtils';
import { canOpenInEditor, getMediaKindFromPath } from '@/components/server/files/fileMediaUtils';
import useFileEditingPresence from '@/plugins/useFileEditingPresence';
import { usePermissions } from '@/plugins/usePermissions';
import { ExplorerDragProvider } from '@/components/server/files/ExplorerDragContext';
import style from './style.module.css';

export default () => {
    const { action } = useParams<{ action?: 'edit' | 'new' }>();
    const history = useHistory();
    const { hash } = useLocation();
    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const { data: files, mutate } = useFileManagerSwr();
    const clearFlashes = useStoreActions((actions) => actions.flashes.clearFlashes);
    const setDirectory = ServerContext.useStoreActions((actions) => actions.files.setDirectory);

    const [tabs, setTabs] = useState<OpenFileTab[]>([]);
    const [activePath, setActivePath] = useState<string | null>(null);
    const [cursorLine, setCursorLine] = useState(1);
    const [newFileModalVisible, setNewFileModalVisible] = useState(false);
    const [newFolderModalVisible, setNewFolderModalVisible] = useState(false);
    const [treeRefreshToken, setTreeRefreshToken] = useState(0);
    const { activeEditors, currentUserUuid } = useFileEditingPresence(uuid, activePath, cursorLine);
    const [canUpdate] = usePermissions(['file.update']);
    const [canCreate] = usePermissions(['file.create']);
    const skipHashSync = useRef(false);
    const tabsRef = useRef(tabs);

    tabsRef.current = tabs;

    const bumpTree = useCallback(() => {
        void mutate();
        setTreeRefreshToken((value) => value + 1);
    }, [mutate]);

    const syncEditorUrl = useCallback(
        (path: string) => {
            skipHashSync.current = true;
            history.replace(`/server/${id}/files#${encodePathSegments(cleanDirectoryPath(path))}`);
        },
        [history, id]
    );

    const openFile = useCallback(
        async (path: string) => {
            const normalized = cleanDirectoryPath(path);
            const mediaKind = getMediaKindFromPath(normalized);
            let shouldFetch = false;

            setTabs((current) => {
                if (current.some((tab) => tab.path === normalized)) {
                    return current;
                }

                shouldFetch = true;
                return [
                    ...current,
                    {
                        path: normalized,
                        content: '',
                        savedContent: '',
                        mode: detectModeFromFilename(getFileName(normalized)),
                        loading: !mediaKind,
                        error: null,
                        mediaKind,
                    },
                ];
            });
            setActivePath(normalized);
            setDirectory(dirname(normalized));
            syncEditorUrl(normalized);

            if (!shouldFetch) {
                return;
            }

            if (mediaKind) {
                return;
            }

            try {
                const content = await getFileContents(uuid, normalized);
                setTabs((current) =>
                    current.map((tab) =>
                        tab.path === normalized
                            ? {
                                  ...tab,
                                  content,
                                  savedContent: content,
                                  loading: false,
                                  error: null,
                                  mode: detectModeFromFilename(getFileName(normalized)),
                              }
                            : tab
                    )
                );
            } catch (error) {
                setTabs((current) =>
                    current.map((tab) =>
                        tab.path === normalized
                            ? {
                                  ...tab,
                                  loading: false,
                                  error: httpErrorToHuman(error),
                              }
                            : tab
                    )
                );
            }
        },
        [syncEditorUrl, uuid]
    );

    useEffect(() => {
        clearFlashes('files');

        if (skipHashSync.current) {
            skipHashSync.current = false;
            return;
        }

        const path = cleanDirectoryPath(hashToPath(hash));
        const matchingTab = tabsRef.current.find((tab) => tab.path === path);

        if (matchingTab) {
            setDirectory(dirname(path));
            setActivePath(path);
            return;
        }

        if (path !== '/' && getFileName(path).includes('.')) {
            void openFile(path);
        }
    }, [hash, openFile]);

    const openNewFileTab = useCallback((fullPath: string) => {
        const normalized = cleanDirectoryPath(fullPath);

        setTabs((current) => {
            if (current.some((tab) => tab.path === normalized)) {
                return current;
            }

            return [
                ...current,
                {
                    path: normalized,
                    content: '',
                    savedContent: '',
                    mode: detectModeFromFilename(getFileName(normalized)),
                    loading: false,
                    error: null,
                    isNew: true,
                },
            ];
        });
        setActivePath(normalized);
        setDirectory(dirname(normalized));
        syncEditorUrl(normalized);
    }, [setDirectory, syncEditorUrl]);

    const handleOpenFileFromTree = useCallback(
        (path: string, file: FileObject) => {
            if (!canOpenInEditor(file)) {
                return;
            }

            void openFile(path);
        },
        [openFile]
    );

    const routeHandled = useRef(false);

    useEffect(() => {
        if (routeHandled.current) {
            return;
        }

        if (action === 'edit' && hash) {
            routeHandled.current = true;
            const path = hashToPath(hash);
            void openFile(path);
            return;
        }

        if (action === 'new') {
            routeHandled.current = true;
            setNewFileModalVisible(true);
            history.replace(`/server/${id}/files${hash}`);
        }
    }, [action, hash, history, id, openFile]);

    const handleActivePathChange = useCallback(
        (path: string | null) => {
            setActivePath(path);
            setCursorLine(1);

            if (path) {
                setDirectory(dirname(path));
                syncEditorUrl(path);
                return;
            }

            setDirectory('/');
            history.replace(`/server/${id}/files`);
        },
        [history, id, syncEditorUrl]
    );

    const handleFileSaved = useCallback(
        (path: string) => {
            bumpTree();
            syncEditorUrl(path);
        },
        [bumpTree, syncEditorUrl]
    );

    const handleItemMoved = useCallback(
        (from: string, to: string) => {
            setTabs((current) =>
                current.map((tab) =>
                    tab.path === from
                        ? {
                              ...tab,
                              path: to,
                              mode: detectModeFromFilename(getFileName(to)),
                          }
                        : tab
                )
            );

            if (activePath === from) {
                setActivePath(to);
                syncEditorUrl(to);
            }
        },
        [activePath, syncEditorUrl]
    );

    const handleItemDeleted = useCallback(
        (path: string) => {
            const normalized = cleanDirectoryPath(path);

            setTabs((current) =>
                current.filter((tab) => tab.path !== normalized && !tab.path.startsWith(`${normalized}/`))
            );

            if (activePath === normalized || activePath?.startsWith(`${normalized}/`)) {
                setActivePath(null);
                setDirectory('/');
                history.replace(`/server/${id}/files`);
            }
        },
        [activePath, history, id]
    );

    return (
        <ServerContentBlock title={'File Manager'} showFlashKey={'files'}>
            <div className={style.ide_layout}>
                <RealmCard className={style.explorer_card} bodyClassName={style.explorer_card_body}>
                    <ExplorerDragProvider
                        canUpdate={canUpdate}
                        canCreate={canCreate}
                        onTreeChange={bumpTree}
                        onItemMoved={handleItemMoved}
                    >
                        <div className={style.explorer_inner}>
                            <FileManagerExplorerToolbar
                                onNewFile={() => setNewFileModalVisible(true)}
                                onTreeChange={bumpTree}
                                newFolderOpen={newFolderModalVisible}
                                onNewFolderOpenChange={setNewFolderModalVisible}
                            />
                            <ErrorBoundary>
                                <FileManagerTreeSidebar
                                    refreshToken={treeRefreshToken}
                                    activeFilePath={activePath}
                                    activeEditors={activeEditors}
                                    currentUserUuid={currentUserUuid}
                                    onOpenFile={handleOpenFileFromTree}
                                    onTreeChange={bumpTree}
                                    onNewFile={() => setNewFileModalVisible(true)}
                                    onNewFolder={() => setNewFolderModalVisible(true)}
                                    onItemMoved={handleItemMoved}
                                    onItemDeleted={handleItemDeleted}
                                />
                            </ErrorBoundary>
                        </div>
                    </ExplorerDragProvider>
                </RealmCard>

                <FileEditorWorkspace
                    tabs={tabs}
                    activePath={activePath}
                    onTabsChange={setTabs}
                    onActivePathChange={handleActivePathChange}
                    onFileSaved={handleFileSaved}
                    activeEditors={activeEditors}
                    currentUserUuid={currentUserUuid}
                    onCursorLineChange={setCursorLine}
                />
            </div>

            <FileNameModal
                visible={newFileModalVisible}
                onDismissed={() => setNewFileModalVisible(false)}
                onFileNamed={(name) => {
                    setNewFileModalVisible(false);
                    openNewFileTab(join(directory, name));
                }}
            />
        </ServerContentBlock>
    );
};
