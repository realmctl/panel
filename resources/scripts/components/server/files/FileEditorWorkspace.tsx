import React, { useCallback, useRef } from 'react';
import { ChevronDoubleDownIcon, ChevronDownIcon, XIcon } from '@heroicons/react/solid';
import MonacoEditor from '@/components/elements/MonacoEditor';
import modes from '@/modes';
import Can from '@/components/elements/Can';
import { Button } from '@/components/elements/button/index';
import Spinner from '@/components/elements/Spinner';
import { getFileName, isTabDirty, OpenFileTab } from '@/components/server/files/fileEditorUtils';
import style from './style.module.css';

interface Props {
    tabs: OpenFileTab[];
    activePath: string | null;
    saving: boolean;
    onTabsChange: (tabs: OpenFileTab[]) => void;
    onActivePathChange: (path: string) => void;
    onCloseTab: (path: string) => void;
    onSave: (path: string) => void;
    onMinimize: () => void;
}

export default ({
    tabs,
    activePath,
    saving,
    onTabsChange,
    onActivePathChange,
    onCloseTab,
    onSave,
    onMinimize,
}: Props) => {
    const fetchContentRef = useRef<(() => Promise<string>) | null>(null);
    const activeTab = tabs.find((tab) => tab.path === activePath) ?? null;

    const updateActiveTab = useCallback(
        (update: Partial<OpenFileTab>) => {
            if (!activeTab) {
                return;
            }

            onTabsChange(tabs.map((tab) => (tab.path === activeTab.path ? { ...tab, ...update } : tab)));
        },
        [activeTab, tabs, onTabsChange]
    );

    const handleSave = useCallback(async () => {
        if (!activeTab || !fetchContentRef.current) {
            return;
        }

        const content = await fetchContentRef.current();
        updateActiveTab({ content });
        onSave(activeTab.path);
    }, [activeTab, updateActiveTab, onSave]);

    return (
        <div className={style.editor_workspace}>
            <div className={style.editor_top_bar}>
                <div className={style.tab_bar}>
                    {tabs.map((tab) => {
                        const dirty = isTabDirty(tab);

                        return (
                            <button
                                key={tab.path}
                                type={'button'}
                                onClick={() => onActivePathChange(tab.path)}
                                className={
                                    tab.path === activePath
                                        ? `${style.tab_item} ${style.tab_item_active}`
                                        : style.tab_item
                                }
                            >
                                {dirty && <span className={style.tab_dot} />}
                                <span className={style.tab_label}>{getFileName(tab.path)}</span>
                                <span
                                    className={style.tab_close}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onCloseTab(tab.path);
                                    }}
                                >
                                    <XIcon className={'w-3 h-3'} />
                                </span>
                            </button>
                        );
                    })}
                </div>
                <button type={'button'} onClick={onMinimize} className={style.minimize_btn} title={'Back to file list'}>
                    <ChevronDoubleDownIcon className={'w-4 h-4'} />
                    Minimize
                </button>
            </div>

            {!activeTab ? (
                <div className={style.editor_empty}>
                    <p className={style.editor_empty_title}>No file open</p>
                    <p className={style.editor_empty_subtitle}>Open a file from the list, or create a new one.</p>
                </div>
            ) : (
                <>
                    <div className={style.editor_breadcrumbs}>{activeTab.path}</div>
                    <div className={style.editor_surface}>
                        {activeTab.loading && <Spinner centered size={Spinner.Size.LARGE} />}
                        {activeTab.error && <p className={style.editor_error}>{activeTab.error}</p>}
                        {!activeTab.loading && !activeTab.error && (
                            <MonacoEditor
                                filename={activeTab.path}
                                mode={activeTab.mode}
                                initialContent={activeTab.content}
                                onContentChanged={(content) => updateActiveTab({ content })}
                                fetchContent={(callback) => {
                                    fetchContentRef.current = callback;
                                }}
                                onContentSaved={handleSave}
                            />
                        )}
                    </div>
                    <div className={style.editor_status_bar}>
                        <div className={style.editor_status_select_wrap}>
                            <select
                                className={style.editor_status_select}
                                value={activeTab.mode}
                                onChange={(e) => updateActiveTab({ mode: e.currentTarget.value })}
                            >
                                {modes.map((mode) => (
                                    <option key={`${mode.name}_${mode.mime}`} value={mode.mime}>
                                        {mode.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDownIcon className={style.editor_status_select_icon} />
                        </div>
                        <Can action={'file.update'}>
                            <Button.Text
                                size={Button.Sizes.Small}
                                disabled={saving || !isTabDirty(activeTab)}
                                onClick={handleSave}
                            >
                                {saving ? 'Saving…' : 'Save'}
                            </Button.Text>
                        </Can>
                    </div>
                </>
            )}
        </div>
    );
};
