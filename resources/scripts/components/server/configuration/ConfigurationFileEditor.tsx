import React, { useEffect, useMemo, useState } from 'react';
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

interface Props {
    config: MinecraftConfigDefinition;
}

export default ({ config }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const serverId = ServerContext.useStoreState((state) => state.server.data!.id);
    const { clearFlashes, addError } = useFlashKey('server:configuration');

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

            const existingPath = await resolveConfigFilePath(uuid, getConfigPaths(config));

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

            try {
                const content = await getFileContents(uuid, existingPath);

                if (cancelled) {
                    return;
                }

                initialContentRef.current = content;

                if (config.format === 'properties') {
                    setPropertyLines(parsePropertiesFile(content));
                    setRawContent('');
                } else {
                    setRawContent(content);
                    setPropertyLines([]);
                }
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
    }, [uuid, config.id]);

    useEffect(() => {
        if (loading) {
            return;
        }

        setDirty(currentContent !== initialContentRef.current);
    }, [currentContent, loading]);

    const save = () => {
        if (!activePath) {
            return;
        }

        clearFlashes();
        setSaving(true);

        saveFileContents(uuid, activePath, currentContent)
            .then(() => {
                initialContentRef.current = currentContent;
                setDirty(false);
            })
            .catch((error) => addError(httpErrorToHuman(error)))
            .then(() => setSaving(false));
    };

    const reset = () => {
        if (config.format === 'properties') {
            setPropertyLines(parsePropertiesFile(initialContentRef.current));
        } else {
            setRawContent(initialContentRef.current);
        }

        setDirty(false);
    };

    return (
        <RealmCard
            header={
                <div className={styles.toolbar}>
                    <div className={styles.toolbarMain}>
                        <h2 className={styles.toolbarTitle}>{config.label}</h2>
                        <p className={styles.toolbarPath}>{activePath}</p>
                    </div>
                    <div className={styles.toolbarActions}>
                        {!missing && (
                            <a
                                href={`/server/${serverId}/files#${encodePathSegments(activePath)}`}
                                className={styles.toolbarLink}
                            >
                                Open in Files
                            </a>
                        )}
                        <Button.Text disabled={!dirty || loading || missing} onClick={reset}>
                            Reset
                        </Button.Text>
                        <Can action={'file.create'}>
                            <Button disabled={!dirty || loading || missing} onClick={save}>
                                Save changes
                            </Button>
                        </Can>
                    </div>
                </div>
            }
        >
            <SpinnerOverlay visible={saving} />

            {loading ? (
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
            )}
        </RealmCard>
    );
};
