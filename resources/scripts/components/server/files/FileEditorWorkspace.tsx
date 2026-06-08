import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import FileEditorEmptyState from '@/components/server/files/FileEditorEmptyState';
import getFileContents from '@/api/server/files/getFileContents';
import saveFileContents from '@/api/server/files/saveFileContents';
import { httpErrorToHuman } from '@/api/http';
const MonacoEditor = lazy(() => import(/* webpackPrefetch: true */ '@/components/elements/MonacoEditor'));
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import Spinner from '@/components/elements/Spinner';
import Button from '@/components/elements/Button';
import Can from '@/components/elements/Can';
import FlashMessageRender from '@/components/FlashMessageRender';
import FileRevisionModal from '@/components/server/files/FileRevisionModal';
import modes from '@/modes';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';
import { detectModeFromFilename, getFileName, isTabDirty, OpenFileTab } from '@/components/server/files/fileEditorUtils';
import ConfigurationFileEditor from '@/components/server/configuration/ConfigurationFileEditor';
import {
    getMinecraftConfigByPath,
    isVisualEditorCompatible,
} from '@/components/server/configuration/minecraftConfigs';
import FileEditorPresenceAvatars from '@/components/server/files/FileEditorPresenceAvatars';
import FileEditorTabContextMenu, { TabContextTarget } from '@/components/server/files/FileEditorTabContextMenu';
import FileMediaViewer from '@/components/server/files/FileMediaViewer';
import { FileEditorPresence } from '@/api/server/files/fileEditingPresence';
import styles from './style.module.css';
import tw from 'twin.macro';

const saveShortcutLabel =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent) ? '⌘S' : 'Ctrl+S';

interface Props {
    tabs: OpenFileTab[];
    activePath: string | null;
    onTabsChange: (tabs: OpenFileTab[]) => void;
    onActivePathChange: (path: string | null) => void;
    onFileSaved?: (path: string) => void;
    activeEditors: FileEditorPresence[];
    currentUserUuid?: string;
    onCursorLineChange: (line: number) => void;
}

export default ({
    tabs,
    activePath,
    onTabsChange,
    onActivePathChange,
    onFileSaved,
    activeEditors,
    currentUserUuid,
    onCursorLineChange,
}: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { addError, clearFlashes } = useFlash();
    const [saving, setSaving] = useState(false);
    const [showRevisions, setShowRevisions] = useState(false);
    const [mediaRefreshToken, setMediaRefreshToken] = useState(0);
    const [editorView, setEditorView] = useState<'text' | 'visual'>('text');
    const [tabContextMenu, setTabContextMenu] = useState<TabContextTarget | null>(null);
    const fetchContentRef = useRef<(() => Promise<string>) | null>(null);

    const activeTab = tabs.find((tab) => tab.path === activePath) ?? null;
    const visualConfig = activeTab ? getMinecraftConfigByPath(activeTab.path) : null;
    const canUseVisualEditor = Boolean(visualConfig && isVisualEditorCompatible(visualConfig));

    useEffect(() => {
        setEditorView('text');
    }, [activePath]);

    const updateTab = useCallback(
        (path: string, patch: Partial<OpenFileTab>) => {
            onTabsChange(tabs.map((tab) => (tab.path === path ? { ...tab, ...patch } : tab)));
        },
        [onTabsChange, tabs]
    );

    const confirmCloseTabs = useCallback((tabsToClose: OpenFileTab[]): boolean => {
        const dirtyTabs = tabsToClose.filter((tab) => isTabDirty(tab));

        if (dirtyTabs.length === 0) {
            return true;
        }

        if (dirtyTabs.length === 1) {
            return window.confirm('Discard unsaved changes?');
        }

        return window.confirm(`Discard unsaved changes in ${dirtyTabs.length} files?`);
    }, []);

    const closeTabs = useCallback(
        (paths: string[]) => {
            if (paths.length === 0) {
                return;
            }

            const pathSet = new Set(paths);
            const tabsToClose = tabs.filter((tab) => pathSet.has(tab.path));

            if (!confirmCloseTabs(tabsToClose)) {
                return;
            }

            const nextTabs = tabs.filter((tab) => !pathSet.has(tab.path));
            onTabsChange(nextTabs);

            if (activePath && pathSet.has(activePath)) {
                const closedIndex = tabs.findIndex((tab) => tab.path === activePath);
                const fallback = nextTabs[closedIndex] ?? nextTabs[closedIndex - 1] ?? null;
                onActivePathChange(fallback?.path ?? null);
            }
        },
        [activePath, confirmCloseTabs, onActivePathChange, onTabsChange, tabs]
    );

    const closeTab = useCallback((path: string) => closeTabs([path]), [closeTabs]);

    const saveActive = useCallback(async () => {
        if (!activeTab || !fetchContentRef.current) {
            return;
        }

        setSaving(true);
        clearFlashes('files:editor');

        try {
            const content = await fetchContentRef.current();
            await saveFileContents(uuid, activeTab.path, content);
            updateTab(activeTab.path, { content, savedContent: content, isNew: false });
            onFileSaved?.(activeTab.path);
        } catch (error) {
            console.error(error);
            addError({ message: httpErrorToHuman(error), key: 'files:editor' });
        } finally {
            setSaving(false);
        }
    }, [activeTab, addError, clearFlashes, onFileSaved, updateTab, uuid]);

    const switchToVisualEditor = useCallback(() => {
        if (!activeTab) {
            return;
        }

        if (isTabDirty(activeTab) && !window.confirm('You have unsaved changes. Continue to the visual editor?')) {
            return;
        }

        setEditorView('visual');
    }, [activeTab]);

    const reloadActive = useCallback(async () => {
        if (!activeTab) {
            return;
        }

        if (activeTab.mediaKind) {
            setMediaRefreshToken((value) => value + 1);
            return;
        }

        updateTab(activeTab.path, { loading: true, error: null });

        try {
            const content = await getFileContents(uuid, activeTab.path);
            updateTab(activeTab.path, {
                content,
                savedContent: content,
                loading: false,
                error: null,
                mode: detectModeFromFilename(getFileName(activeTab.path)),
            });
        } catch (error) {
            updateTab(activeTab.path, {
                loading: false,
                error: httpErrorToHuman(error),
            });
        }
    }, [activeTab, updateTab, uuid]);

    const switchToTextEditor = useCallback(() => {
        setEditorView('text');
    }, []);

    const handleVisualSaved = useCallback(
        (content: string) => {
            if (!activeTab) {
                return;
            }

            updateTab(activeTab.path, { content, savedContent: content, isNew: false });
            onFileSaved?.(activeTab.path);
        },
        [activeTab, onFileSaved, updateTab]
    );

    return (
        <div className={styles.editor_workspace}>
            <FlashMessageRender byKey={'files:editor'} css={tw`mx-4 mt-3`} />

            {tabs.length > 0 && (
                <div className={styles.editor_top_bar}>
                    <div className={styles.tab_bar}>
                        {tabs.map((tab, index) => {
                            const active = tab.path === activePath;
                            const dirty = isTabDirty(tab);

                            return (
                                <button
                                    key={tab.path}
                                    type={'button'}
                                    onClick={() => onActivePathChange(tab.path)}
                                    onContextMenu={(event) => {
                                        event.preventDefault();
                                        setTabContextMenu({
                                            path: tab.path,
                                            index,
                                            x: event.clientX,
                                            y: event.clientY,
                                        });
                                    }}
                                    className={classNames(styles.tab_item, active && styles.tab_item_active)}
                                    title={tab.path}
                                >
                                    {dirty && <span className={styles.tab_dot} />}
                                    <span className={styles.tab_label}>{getFileName(tab.path)}</span>
                                    <span
                                        className={styles.tab_close}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            closeTab(tab.path);
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {!activeTab ? (
                <div className={styles.editor_surface_empty}>
                    <FileEditorEmptyState />
                </div>
            ) : (
                <>
                    <div className={styles.editor_body}>
                        {activeTab.path.endsWith('.realmignore') && (
                            <div className={styles.editor_notice}>
                                <p className={'text-neutral-300 text-xs m-0'}>
                                    You&apos;re editing a <code className={'font-mono bg-black rounded py-px px-1'}>.realmignore</code>{' '}
                                    file. Listed paths are excluded from backups. Wildcards use{' '}
                                    <code className={'font-mono bg-black rounded py-px px-1'}>*</code>; negate with{' '}
                                    <code className={'font-mono bg-black rounded py-px px-1'}>!</code>.
                                </p>
                            </div>
                        )}

                        {activeTab.loading ? (
                            <div className={'flex items-center justify-center h-full'}>
                                <Spinner size={'large'} />
                            </div>
                        ) : activeTab.error ? (
                            <div className={'flex flex-col items-center justify-center h-full gap-3 px-6 text-center'}>
                                <p className={'text-sm text-red-300 m-0'}>{activeTab.error}</p>
                                <Button isSecondary onClick={() => void reloadActive()}>
                                    Retry
                                </Button>
                            </div>
                        ) : activeTab.mediaKind ? (
                            <FileMediaViewer
                                key={`${activeTab.path}:${mediaRefreshToken}`}
                                uuid={uuid}
                                path={activeTab.path}
                                mediaKind={activeTab.mediaKind}
                            />
                        ) : editorView === 'visual' && visualConfig ? (
                            <ConfigurationFileEditor
                                key={`${activeTab.path}:visual`}
                                config={visualConfig}
                                embedded
                                filePath={activeTab.path}
                                initialContent={activeTab.content}
                                onSaved={handleVisualSaved}
                            />
                        ) : (
                            <div className={styles.editor_surface}>
                                <SpinnerOverlay visible={saving} />
                                <Suspense
                                    fallback={
                                        <div css={tw`flex items-center justify-center h-full`}>
                                            <Spinner size={'large'} />
                                        </div>
                                    }
                                >
                                    <MonacoEditor
                                        key={activeTab.path}
                                        style={{ height: '100%', minHeight: 0 }}
                                        mode={activeTab.mode}
                                        filename={activeTab.path}
                                        initialContent={activeTab.content}
                                        onModeChanged={(mode) => updateTab(activeTab.path, { mode })}
                                        fetchContent={(callback) => {
                                            fetchContentRef.current = callback;
                                        }}
                                        onContentChanged={(content) => updateTab(activeTab.path, { content })}
                                        onContentSaved={() => void saveActive()}
                                        onCursorLineChange={onCursorLineChange}
                                    />
                                </Suspense>
                            </div>
                        )}
                    </div>

                    {!activeTab.mediaKind && editorView === 'text' && (
                        <div className={styles.editor_status_bar}>
                            <div className={styles.editor_status_start}>
                                {activeEditors.length > 0 && (
                                    <>
                                        <FileEditorPresenceAvatars
                                            editors={activeEditors}
                                            currentUserUuid={currentUserUuid}
                                            className={styles.tab_presence}
                                            size={16}
                                            maxVisible={3}
                                        />
                                        <span className={styles.editor_status_divider} aria-hidden />
                                    </>
                                )}
                                <select
                                    className={styles.editor_status_select}
                                    value={activeTab.mode}
                                    onChange={(event) => updateTab(activeTab.path, { mode: event.currentTarget.value })}
                                    aria-label={'Syntax highlighting'}
                                >
                                    {modes.map((mode) => (
                                        <option key={`${mode.name}_${mode.mime}`} value={mode.mime}>
                                            {mode.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.editor_status_end}>
                                {canUseVisualEditor && (
                                    <button
                                        type={'button'}
                                        className={styles.editor_status_link}
                                        onClick={switchToVisualEditor}
                                    >
                                        Visual editor
                                        <span className={styles.preview_badge}>Preview</span>
                                    </button>
                                )}
                                {!activeTab.isNew && (
                                    <Can action={'file.revision-read'}>
                                        <button
                                            type={'button'}
                                            className={styles.editor_status_link}
                                            onClick={() => setShowRevisions(true)}
                                        >
                                            History
                                        </button>
                                    </Can>
                                )}
                                <Can action={activeTab.isNew ? 'file.create' : 'file.update'}>
                                    <button
                                        type={'button'}
                                        className={styles.editor_status_link}
                                        onClick={() => void saveActive()}
                                        disabled={saving || activeTab.loading}
                                    >
                                        {activeTab.isNew ? 'Create' : 'Save'}
                                        <span className={styles.editor_status_kbd}>{saveShortcutLabel}</span>
                                    </button>
                                </Can>
                            </div>
                        </div>
                    )}

                    {!activeTab.mediaKind && editorView === 'visual' && (
                        <div className={styles.editor_status_bar}>
                            <div className={styles.editor_status_start}>
                                <button
                                    type={'button'}
                                    className={styles.editor_status_link}
                                    onClick={switchToTextEditor}
                                >
                                    Text editor
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {activeTab && !activeTab.isNew && !activeTab.mediaKind && editorView === 'text' && (
                <FileRevisionModal
                    visible={showRevisions}
                    filePath={activeTab.path}
                    onDismissed={() => setShowRevisions(false)}
                    onRestored={() => void reloadActive()}
                />
            )}

            <FileEditorTabContextMenu
                target={tabContextMenu}
                tabCount={tabs.length}
                onClose={() => setTabContextMenu(null)}
                onCloseTab={() => {
                    if (tabContextMenu) {
                        closeTab(tabContextMenu.path);
                    }
                }}
                onCloseOthers={() => {
                    if (!tabContextMenu) {
                        return;
                    }

                    closeTabs(tabs.filter((tab) => tab.path !== tabContextMenu.path).map((tab) => tab.path));
                }}
                onCloseToRight={() => {
                    if (!tabContextMenu) {
                        return;
                    }

                    closeTabs(tabs.slice(tabContextMenu.index + 1).map((tab) => tab.path));
                }}
                onCloseToLeft={() => {
                    if (!tabContextMenu) {
                        return;
                    }

                    closeTabs(tabs.slice(0, tabContextMenu.index).map((tab) => tab.path));
                }}
                onCloseAll={() => closeTabs(tabs.map((tab) => tab.path))}
            />
        </div>
    );
};
