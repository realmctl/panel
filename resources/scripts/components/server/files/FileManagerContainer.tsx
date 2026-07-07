import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { httpErrorToHuman } from '@/api/http';
import { CSSTransition } from 'react-transition-group';
import Spinner from '@/components/elements/Spinner';
import FileObjectRow from '@/components/server/files/FileObjectRow';
import FileManagerBreadcrumbs from '@/components/server/files/FileManagerBreadcrumbs';
import { FileObject } from '@/api/server/files/loadDirectory';
import NewDirectoryButton from '@/components/server/files/NewDirectoryButton';
import Can from '@/components/elements/Can';
import { ServerError } from '@/components/elements/ScreenBlock';
import { Button } from '@/components/elements/button/index';
import { ServerContext } from '@/state/server';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import FileManagerStatus from '@/components/server/files/FileManagerStatus';
import MassActionsBar from '@/components/server/files/MassActionsBar';
import UploadButton from '@/components/server/files/UploadButton';
import SftpDetailsButton from '@/components/server/files/SftpDetailsButton';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { useStoreActions } from '@/state/hooks';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import { FileActionCheckbox } from '@/components/server/files/SelectFileCheckbox';
import { encodePathSegments, hashToPath } from '@/helpers';
import { dirname } from 'pathe';
import getFileContents from '@/api/server/files/getFileContents';
import saveFileContents from '@/api/server/files/saveFileContents';
import useFlash from '@/plugins/useFlash';
import FileNameModal from '@/components/server/files/FileNameModal';
import FileEditorWorkspace from '@/components/server/files/FileEditorWorkspace';
import { detectModeFromFilename, getFileName, isTabDirty, OpenFileTab } from '@/components/server/files/fileEditorUtils';
import { ChevronDoubleUpIcon } from '@heroicons/react/solid';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import style from './style.module.css';

const sortFiles = (files: FileObject[]): FileObject[] => {
    const sortedFiles: FileObject[] = files
        .sort((a, b) => a.name.localeCompare(b.name))
        .sort((a, b) => (a.isFile === b.isFile ? 0 : a.isFile ? 1 : -1));
    return sortedFiles.filter((file, index) => index === 0 || file.name !== sortedFiles[index - 1].name);
};

export default () => {
    const history = useHistory();
    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { hash } = useLocation();
    const { data: files, error, mutate } = useFileManagerSwr();
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const clearFlashes = useStoreActions((actions) => actions.flashes.clearFlashes);
    const { clearAndAddHttpError } = useFlash();
    const setDirectory = ServerContext.useStoreActions((actions) => actions.files.setDirectory);
    const setSelectedFiles = ServerContext.useStoreActions((actions) => actions.files.setSelectedFiles);
    const selectedFilesLength = ServerContext.useStoreState((state) => state.files.selectedFiles.length);

    const [view, setView] = useState<'browse' | 'edit'>('browse');
    const [tabs, setTabs] = useState<OpenFileTab[]>([]);
    const [activePath, setActivePath] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [newFileModalVisible, setNewFileModalVisible] = useState(false);
    const skipHashSync = useRef(false);
    const tabsRef = useRef(tabs);
    tabsRef.current = tabs;

    const syncEditUrl = useCallback(
        (path: string) => {
            skipHashSync.current = true;
            history.replace(`/server/${id}/files#${encodePathSegments(path)}`);
        },
        [history, id]
    );

    const openFile = useCallback(
        (path: string) => {
            const existing = tabsRef.current.find((tab) => tab.path === path);

            setActivePath(path);
            setView('edit');
            setDirectory(dirname(path));

            if (existing) {
                return;
            }

            const mode = detectModeFromFilename(path);
            setTabs((current) => [
                ...current,
                { path, content: '', savedContent: '', mode, loading: true, error: null },
            ]);

            getFileContents(uuid, path)
                .then((content) => {
                    setTabs((current) =>
                        current.map((tab) =>
                            tab.path === path ? { ...tab, content, savedContent: content, loading: false } : tab
                        )
                    );
                })
                .catch((err) => {
                    setTabs((current) =>
                        current.map((tab) =>
                            tab.path === path ? { ...tab, loading: false, error: httpErrorToHuman(err) } : tab
                        )
                    );
                });
        },
        [uuid, setDirectory]
    );

    useEffect(() => {
        clearFlashes('files');

        if (skipHashSync.current) {
            skipHashSync.current = false;
            return;
        }

        const path = hashToPath(hash);

        if (path !== '/' && getFileName(path).includes('.')) {
            openFile(path);
            return;
        }

        setView('browse');
        setSelectedFiles([]);
        setDirectory(path);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hash]);

    useEffect(() => {
        mutate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [directory]);

    const handleTabsChange = useCallback((next: OpenFileTab[]) => setTabs(next), []);

    const handleActivePathChange = useCallback(
        (path: string) => {
            setActivePath(path);
            setDirectory(dirname(path));
            syncEditUrl(path);
        },
        [setDirectory, syncEditUrl]
    );

    const handleCloseTab = useCallback(
        (path: string) => {
            const tab = tabsRef.current.find((t) => t.path === path);

            if (tab && isTabDirty(tab)) {
                const confirmed = window.confirm(`Discard unsaved changes to ${path}?`);
                if (!confirmed) {
                    return;
                }
            }

            const remaining = tabsRef.current.filter((t) => t.path !== path);
            setTabs(remaining);

            if (activePath !== path) {
                return;
            }

            const next = remaining[remaining.length - 1] ?? null;
            setActivePath(next?.path ?? null);

            if (next) {
                syncEditUrl(next.path);
            } else {
                skipHashSync.current = true;
                history.replace(`/server/${id}/files`);
                setView('browse');
            }
        },
        [activePath, history, id, syncEditUrl]
    );

    const handleSave = useCallback(
        (path: string) => {
            const tab = tabsRef.current.find((t) => t.path === path);
            if (!tab) {
                return;
            }

            setSaving(true);
            clearFlashes('files');

            saveFileContents(uuid, path, tab.content)
                .then(() => {
                    setTabs((current) =>
                        current.map((t) => (t.path === path ? { ...t, savedContent: t.content } : t))
                    );
                    void mutate();
                })
                .catch((err) => clearAndAddHttpError({ key: 'files', error: err }))
                .then(() => setSaving(false));
        },
        [uuid, clearFlashes, clearAndAddHttpError, mutate]
    );

    const handleMinimize = useCallback(() => {
        skipHashSync.current = true;
        history.replace(`/server/${id}/files#${encodePathSegments(directory)}`);
        setView('browse');
    }, [history, id, directory]);

    const handleRestoreSession = useCallback(() => {
        if (activePath) {
            syncEditUrl(activePath);
        }
        setView('edit');
    }, [activePath, syncEditUrl]);

    const handleCreateFile = useCallback(
        (fullPath: string) => {
            setNewFileModalVisible(false);
            const mode = detectModeFromFilename(fullPath);
            setTabs((current) => {
                if (current.some((tab) => tab.path === fullPath)) {
                    return current;
                }
                return [...current, { path: fullPath, content: '', savedContent: '', mode, loading: false, error: null, isNew: true }];
            });
            setActivePath(fullPath);
            setView('edit');
            syncEditUrl(fullPath);
        },
        [syncEditUrl]
    );

    const onSelectAllClick = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedFiles(e.currentTarget.checked ? files?.map((file) => file.name) || [] : []);
    };

    if (error) {
        return <ServerError message={httpErrorToHuman(error)} onRetry={() => mutate()} />;
    }

    return (
        <ServerContentBlock title={'File Manager'} showFlashKey={'files'}>
            <FileNameModal
                visible={newFileModalVisible}
                onDismissed={() => setNewFileModalVisible(false)}
                onFileNamed={handleCreateFile}
            />

            {view === 'edit' ? (
                <FileEditorWorkspace
                    tabs={tabs}
                    activePath={activePath}
                    saving={saving}
                    onTabsChange={handleTabsChange}
                    onActivePathChange={handleActivePathChange}
                    onCloseTab={handleCloseTab}
                    onSave={handleSave}
                    onMinimize={handleMinimize}
                />
            ) : (
                <>
                    <ErrorBoundary>
                        <div className={'flex items-center justify-between gap-3 flex-wrap mb-4'}>
                            <div className={style.breadcrumb_card}>
                                <FileManagerBreadcrumbs />
                            </div>
                            <div className={'flex items-center gap-2 flex-wrap'}>
                                <Can action={'file.create'}>
                                    <>
                                        <FileManagerStatus />
                                        <NewDirectoryButton />
                                        <UploadButton />
                                        <Button
                                            className={'flex items-center gap-1.5'}
                                            onClick={() => setNewFileModalVisible(true)}
                                        >
                                            <FontAwesomeIcon icon={faPlus} className={'text-xs'} />
                                            New File
                                        </Button>
                                    </>
                                </Can>
                                <SftpDetailsButton />
                            </div>
                        </div>
                    </ErrorBoundary>
                    {!files ? (
                        <Spinner size={'large'} centered />
                    ) : (
                        <>
                            {!files.length ? (
                                <div className={'flex flex-col items-center justify-center py-16'}>
                                    <h3 className={'text-lg font-semibold text-neutral-100 mb-1'}>
                                        This directory is empty
                                    </h3>
                                    <p className={'text-sm text-neutral-400 text-center max-w-sm'}>
                                        Upload files or create a new directory to get started.
                                    </p>
                                </div>
                            ) : (
                                <CSSTransition classNames={'fade'} timeout={150} appear in>
                                    <div>
                                        {files.length > 250 && (
                                            <div className={'rounded-md bg-yellow-400 mb-3 p-3'}>
                                                <p className={'text-yellow-900 text-sm text-center m-0'}>
                                                    This directory is too large to display in the browser, limiting
                                                    the output to the first 250 files.
                                                </p>
                                            </div>
                                        )}
                                        <div
                                            className={
                                                'rounded-md border border-realm-border/50 bg-realm-card overflow-hidden'
                                            }
                                        >
                                            <div
                                                className={
                                                    'grid grid-cols-12 gap-4 px-4 py-2 border-b border-realm-border/50'
                                                }
                                            >
                                                <div
                                                    className={
                                                        'col-span-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-neutral-500'
                                                    }
                                                >
                                                    <FileActionCheckbox
                                                        checked={
                                                            selectedFilesLength ===
                                                            (files?.length === 0 ? -1 : files?.length)
                                                        }
                                                        onChange={onSelectAllClick}
                                                    />
                                                    Name
                                                </div>
                                                <div
                                                    className={
                                                        'col-span-2 text-xs font-medium uppercase tracking-wide text-neutral-500 text-right'
                                                    }
                                                >
                                                    Size
                                                </div>
                                                <div
                                                    className={
                                                        'col-span-3 text-xs font-medium uppercase tracking-wide text-neutral-500'
                                                    }
                                                >
                                                    Modified
                                                </div>
                                                <div className={'col-span-1'} />
                                            </div>
                                            <div className={'divide-y divide-realm-border/50'}>
                                                {sortFiles(files.slice(0, 250)).map((file) => (
                                                    <FileObjectRow key={file.key} file={file} />
                                                ))}
                                            </div>
                                        </div>
                                        <MassActionsBar />
                                    </div>
                                </CSSTransition>
                            )}
                        </>
                    )}
                    {tabs.length > 0 && (
                        <button type={'button'} onClick={handleRestoreSession} className={style.restore_session_btn}>
                            <ChevronDoubleUpIcon className={'w-4 h-4'} />
                            Back to editor ({tabs.length})
                        </button>
                    )}
                </>
            )}
        </ServerContentBlock>
    );
};
