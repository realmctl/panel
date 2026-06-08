import React, { useCallback, useEffect, useMemo, useState } from 'react';
import getFileContents from '@/api/server/files/getFileContents';
import saveFileContents from '@/api/server/files/saveFileContents';
import { httpErrorToHuman } from '@/api/http';
import { ServerContext } from '@/state/server';
import { useFlashKey } from '@/plugins/useFlash';
import Spinner from '@/components/elements/Spinner';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import Can from '@/components/elements/Can';
import { Button } from '@/components/elements/button/index';
import RealmCard from '@/components/elements/realm/RealmCard';
import PropertiesConfigForm from '@/components/server/configuration/PropertiesConfigForm';
import EulaConfigForm from '@/components/server/configuration/EulaConfigForm';
import { getConfigPaths, MinecraftConfigDefinition } from '@/components/server/configuration/minecraftConfigs';
import { resolveConfigFilePath } from '@/components/server/configuration/resolveConfigFile';
import { parsePropertiesFile, serializePropertiesFile, PropertiesLine } from '@/lib/propertiesFile';
import { encodePathSegments } from '@/helpers';
import styles from './style.module.css';

const saveShortcutLabel =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent) ? '⌘S' : 'Ctrl+S';

interface Props {
    config: MinecraftConfigDefinition;
    embedded?: boolean;
    filePath?: string;
    /** When opening from the file editor, reuse content already loaded in the tab. */
    initialContent?: string;
    onSaved?: (content: string) => void;
}

const applyLoadedContent = (
    config: MinecraftConfigDefinition,
    content: string,
    setPropertyLines: (lines: PropertiesLine[]) => void,
    setRawContent: (content: string) => void,
    initialContentRef: React.MutableRefObject<string>
) => {
    initialContentRef.current = content;

    if (config.format === 'properties') {
        setPropertyLines(parsePropertiesFile(content));
        setRawContent('');
    } else {
        setRawContent(content);
        setPropertyLines([]);
    }
};

export default ({ config, embedded = false, filePath, initialContent, onSaved }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const serverId = ServerContext.useStoreState((state) => state.server.data!.id);
    const { clearFlashes, addError } = useFlashKey(embedded ? 'files:editor' : 'server:configuration');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [missing, setMissing] = useState(false);
    const [resolvedPath, setResolvedPath] = useState<string | null>(null);
    const [rawContent, setRawContent] = useState('');
    const [propertyLines, setPropertyLines] = useState<PropertiesLine[]>([]);
    const [dirty, setDirty] = useState(false);

    const serializedProperties = useMemo(() => serializePropertiesFile(propertyLines), [propertyLines]);
    const currentContent = config.format === 'properties' ? serializedProperties : rawContent;
    const initialContentRef = React.useRef('');
    const activePath = resolvedPath ?? config.path;

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setMissing(false);
            setDirty(false);
            setResolvedPath(null);
            clearFlashes();

            const existingPath =
                filePath ?? (await resolveConfigFilePath(uuid, getConfigPaths(config)));

            if (cancelled) {
                return;
            }

            if (!existingPath) {
                setMissing(true);
                initialContentRef.current = '';
                setRawContent('');
                setPropertyLines([]);
                setLoading(false);
                return;
            }

            setResolvedPath(existingPath);

            if (filePath && initialContent !== undefined) {
                applyLoadedContent(config, initialContent, setPropertyLines, setRawContent, initialContentRef);

                if (!cancelled) {
                    setLoading(false);
                }

                return;
            }

            try {
                const content = await getFileContents(uuid, existingPath);

                if (cancelled) {
                    return;
                }

                applyLoadedContent(config, content, setPropertyLines, setRawContent, initialContentRef);
            } catch (error) {
                if (cancelled) {
                    return;
                }

                if (error?.response?.status === 404) {
                    setMissing(true);
                    initialContentRef.current = '';
                    setRawContent('');
                    setPropertyLines([]);
                } else {
                    addError(httpErrorToHuman(error));
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [uuid, config.id, filePath, initialContent]);

    useEffect(() => {
        if (loading) {
            return;
        }

        setDirty(currentContent !== initialContentRef.current);
    }, [currentContent, loading]);

    const save = useCallback(() => {
        if (!activePath || !dirty || loading || missing) {
            return;
        }

        clearFlashes();
        setSaving(true);

        saveFileContents(uuid, activePath, currentContent)
            .then(() => {
                initialContentRef.current = currentContent;
                setDirty(false);
                onSaved?.(currentContent);
            })
            .catch((error) => addError(httpErrorToHuman(error)))
            .then(() => setSaving(false));
    }, [activePath, addError, clearFlashes, currentContent, dirty, loading, missing, onSaved, uuid]);

    useEffect(() => {
        if (!embedded) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
                event.preventDefault();
                save();
            }
        };

        document.addEventListener('keydown', onKeyDown);

        return () => document.removeEventListener('keydown', onKeyDown);
    }, [embedded, save]);

    const reset = () => {
        if (config.format === 'properties') {
            setPropertyLines(parsePropertiesFile(initialContentRef.current));
        } else {
            setRawContent(initialContentRef.current);
        }

        setDirty(false);
    };

    const displayPath = activePath.startsWith('/') ? activePath : `/${activePath}`;
    const actionsDisabled = !dirty || loading || missing || saving;

    const toolbar = (
        <div className={styles.toolbar}>
            <div className={styles.toolbarMain}>
                <h2 className={styles.toolbarTitle}>
                    {config.label}
                    {embedded && <span className={styles.previewBadge}>Preview</span>}
                </h2>
                <p className={styles.toolbarPath}>{displayPath}</p>
            </div>
            <div className={styles.toolbarActions}>
                {!embedded && !missing && (
                    <a
                        href={`/server/${serverId}/files#${encodePathSegments(activePath)}`}
                        className={styles.toolbarLink}
                    >
                        Open in Files
                    </a>
                )}
                {embedded ? (
                    <>
                        <button
                            type={'button'}
                            className={styles.toolbarAction}
                            disabled={actionsDisabled}
                            onClick={reset}
                        >
                            Reset
                        </button>
                        <Can action={'file.create'}>
                            <button
                                type={'button'}
                                className={styles.toolbarAction}
                                disabled={actionsDisabled}
                                onClick={save}
                            >
                                Save
                                <span className={styles.toolbarKbd}>{saveShortcutLabel}</span>
                            </button>
                        </Can>
                    </>
                ) : (
                    <>
                        <Button.Text disabled={actionsDisabled} onClick={reset}>
                            Reset
                        </Button.Text>
                        <Can action={'file.create'}>
                            <Button disabled={actionsDisabled} onClick={save}>
                                Save changes
                            </Button>
                        </Can>
                    </>
                )}
            </div>
        </div>
    );

    const editorBody = loading ? (
        <Spinner size={'large'} centered />
    ) : missing ? (
        <div className={styles.emptyState}>
            <h3 className={styles.emptyTitle}>Configuration file not found</h3>
            <p className={'text-sm text-neutral-400 max-w-lg'}>
                None of the expected paths exist on this server yet:
            </p>
            <ul className={styles.pathList}>
                {getConfigPaths(config).map((path) => (
                    <li key={path}>
                        <code className={styles.pathCode}>{path}</code>
                    </li>
                ))}
            </ul>
            {config.unavailableHint && (
                <p className={'text-sm text-neutral-500 max-w-lg'}>{config.unavailableHint}</p>
            )}
        </div>
    ) : config.format === 'properties' ? (
        <PropertiesConfigForm
            config={config}
            lines={propertyLines}
            onChange={(lines) => {
                setPropertyLines(lines);
            }}
        />
    ) : config.format === 'eula' ? (
        <EulaConfigForm
            content={rawContent}
            onChange={(content) => {
                setRawContent(content);
            }}
        />
    ) : (
        <div className={styles.rawEditorWrap}>
            <textarea
                className={styles.rawEditor}
                value={rawContent}
                spellCheck={false}
                onChange={(event) => setRawContent(event.currentTarget.value)}
            />
        </div>
    );

    if (embedded) {
        return (
            <div className={styles.embeddedWrap}>
                <SpinnerOverlay visible={saving} />
                <div className={styles.embeddedToolbar}>{toolbar}</div>
                <div className={styles.embeddedBody}>{editorBody}</div>
            </div>
        );
    }

    return (
        <RealmCard header={toolbar}>
            <SpinnerOverlay visible={saving} />
            {editorBody}
        </RealmCard>
    );
};
