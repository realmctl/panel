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
import useFileEditingPresence from '@/plugins/useFileEditingPresence';
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
    const [treeRefreshToken, setTreeRefreshToken] = useState(0);
    const { activeEditors, currentUserUuid } = useFileEditingPresence(uuid, activePath, cursorLine);
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
                        loading: true,
                        error: null,
                    },
                ];
            });
            setActivePath(normalized);
            setDirectory(dirname(normalized));
            syncEditorUrl(normalized);

            if (!shouldFetch) {
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
            return;
        }

        setDirectory(path);
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
            if (!file.isEditable()) {
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

            syncEditorUrl(directory);
        },
        [directory, syncEditorUrl]
    );

    const handleFileSaved = useCallback(
        (path: string) => {
            bumpTree();
            syncEditorUrl(path);
        },
        [bumpTree, syncEditorUrl]
    );

    return (
        <ServerContentBlock title={'File Manager'} showFlashKey={'files'}>
            <div className={style.ide_layout}>
                <RealmCard className={style.explorer_card} bodyClassName={style.explorer_card_body}>
                    <div className={style.explorer_inner}>
                        <FileManagerExplorerToolbar
                            onNewFile={() => setNewFileModalVisible(true)}
                            onImported={bumpTree}
                        />
                        <ErrorBoundary>
                            <FileManagerTreeSidebar
                                refreshToken={treeRefreshToken || files}
                                activeFilePath={activePath}
                                activeEditors={activeEditors}
                                currentUserUuid={currentUserUuid}
                                onOpenFile={handleOpenFileFromTree}
                            />
                        </ErrorBoundary>
                    </div>
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
