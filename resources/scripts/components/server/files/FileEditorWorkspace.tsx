import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileCode, faTimes } from '@fortawesome/free-solid-svg-icons';
import getFileContents from '@/api/server/files/getFileContents';
import saveFileContents from '@/api/server/files/saveFileContents';
import { httpErrorToHuman } from '@/api/http';
const MonacoEditor = lazy(() => import('@/components/elements/MonacoEditor'));
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import Spinner from '@/components/elements/Spinner';
import Select from '@/components/elements/Select';
import Button from '@/components/elements/Button';
import Can from '@/components/elements/Can';
import FlashMessageRender from '@/components/FlashMessageRender';
import FileRevisionModal from '@/components/server/files/FileRevisionModal';
import modes from '@/modes';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';
import { detectModeFromFilename, getFileName, isTabDirty, OpenFileTab } from '@/components/server/files/fileEditorUtils';
import styles from './style.module.css';
import tw from 'twin.macro';

interface Props {
    tabs: OpenFileTab[];
    activePath: string | null;
    onTabsChange: (tabs: OpenFileTab[]) => void;
    onActivePathChange: (path: string | null) => void;
    onFileSaved?: (path: string) => void;
}

const EMPTY_PREVIEW_LINES = 8;

const EditorEmptyState = () => (
    <div className={styles.editor_empty}>
        <div className={styles.editor_empty_preview} aria-hidden>
            <div className={styles.editor_empty_gutter}>
                {Array.from({ length: EMPTY_PREVIEW_LINES }).map((_, index) => (
                    <span key={index}>{index + 1}</span>
                ))}
            </div>
            <div className={styles.editor_empty_lines}>
                {Array.from({ length: EMPTY_PREVIEW_LINES }).map((_, index) => (
                    <span
                        key={index}
                        className={
                            index % 3 === 1
                                ? styles.editor_empty_short
                                : index % 4 === 2
                                  ? styles.editor_empty_medium
                                  : undefined
                        }
                    />
                ))}
            </div>
        </div>
        <div className={styles.editor_empty_message}>
            <div className={styles.editor_empty_message_card}>
                <FontAwesomeIcon icon={faFileCode} className={'text-3xl text-neutral-400 mb-3'} />
                <p className={'text-sm font-medium text-neutral-100 m-0 mb-1'}>Open a file to start editing</p>
                <p className={'text-xs text-neutral-400 m-0'}>Select a file from the tree on the left</p>
            </div>
        </div>
    </div>
);

export default ({ tabs, activePath, onTabsChange, onActivePathChange, onFileSaved }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { addError, clearFlashes } = useFlash();
    const [saving, setSaving] = useState(false);
    const [showRevisions, setShowRevisions] = useState(false);
    const fetchContentRef = useRef<(() => Promise<string>) | null>(null);

    const activeTab = tabs.find((tab) => tab.path === activePath) ?? null;

    const updateTab = useCallback(
        (path: string, patch: Partial<OpenFileTab>) => {
            onTabsChange(tabs.map((tab) => (tab.path === path ? { ...tab, ...patch } : tab)));
        },
        [onTabsChange, tabs]
    );

    const closeTab = useCallback(
        (path: string) => {
            const tab = tabs.find((entry) => entry.path === path);
            if (tab && isTabDirty(tab) && !window.confirm('Discard unsaved changes?')) {
                return;
            }

            const nextTabs = tabs.filter((entry) => entry.path !== path);
            onTabsChange(nextTabs);

            if (activePath === path) {
                const index = tabs.findIndex((entry) => entry.path === path);
                const fallback = nextTabs[index] ?? nextTabs[index - 1] ?? null;
                onActivePathChange(fallback?.path ?? null);
            }
        },
        [activePath, onActivePathChange, onTabsChange, tabs]
    );

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

    const reloadActive = useCallback(async () => {
        if (!activeTab) {
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

    return (
        <div className={styles.editor_workspace}>
            <FlashMessageRender byKey={'files:editor'} css={tw`mx-4 mt-3`} />

            {tabs.length > 0 && (
                <div className={styles.editor_top_bar}>
                    <div className={styles.tab_bar}>
                        {tabs.map((tab) => {
                            const active = tab.path === activePath;
                            const dirty = isTabDirty(tab);

                            return (
                                <button
                                    key={tab.path}
                                    type={'button'}
                                    onClick={() => onActivePathChange(tab.path)}
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
                    <EditorEmptyState />
                </div>
            ) : (
                <div className={styles.editor_panel}>
                    {activeTab.path.endsWith('.pteroignore') && (
                        <div className={'mx-4 mt-3 p-3 border-l-4 bg-neutral-900 rounded border-cyan-400'}>
                            <p className={'text-neutral-300 text-xs m-0'}>
                                You&apos;re editing a <code className={'font-mono bg-black rounded py-px px-1'}>.pteroignore</code>{' '}
                                file. Listed paths are excluded from backups. Wildcards use{' '}
                                <code className={'font-mono bg-black rounded py-px px-1'}>*</code>; negate with{' '}
                                <code className={'font-mono bg-black rounded py-px px-1'}>!</code>.
                            </p>
                        </div>
                    )}

                    <div className={styles.editor_body}>
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
                                    />
                                </Suspense>
                            </div>
                        )}
                    </div>

                    <div className={styles.editor_footer}>
                        <div className={styles.editor_footer_left}>
                            <Select
                                value={activeTab.mode}
                                onChange={(event) => updateTab(activeTab.path, { mode: event.currentTarget.value })}
                            >
                                {modes.map((mode) => (
                                    <option key={`${mode.name}_${mode.mime}`} value={mode.mime}>
                                        {mode.name}
                                    </option>
                                ))}
                            </Select>
                        </div>
                        <div className={styles.editor_footer_right}>
                            {!activeTab.isNew && (
                                <Can action={'file.revision-read'}>
                                    <Button isSecondary onClick={() => setShowRevisions(true)}>
                                        History
                                    </Button>
                                </Can>
                            )}
                            <Can action={activeTab.isNew ? 'file.create' : 'file.update'}>
                                <Button onClick={() => void saveActive()} disabled={saving || activeTab.loading}>
                                    {activeTab.isNew ? 'Create File' : 'Save'}
                                </Button>
                            </Can>
                        </div>
                    </div>
                </div>
            )}

            {activeTab && !activeTab.isNew && (
                <FileRevisionModal
                    visible={showRevisions}
                    filePath={activeTab.path}
                    onDismissed={() => setShowRevisions(false)}
                    onRestored={() => void reloadActive()}
                />
            )}
        </div>
    );
};
