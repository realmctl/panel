import React, { useCallback, useMemo } from 'react';
import { useHistory, useLocation, useRouteMatch } from 'react-router-dom';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import FlashMessageRender from '@/components/FlashMessageRender';
import RealmCard from '@/components/elements/realm/RealmCard';
import ConfigurationFileEditor from '@/components/server/configuration/ConfigurationFileEditor';
import {
    CONFIG_CATEGORIES,
    MINECRAFT_CONFIGS,
    getConfigsByCategory,
    getMinecraftConfigById,
} from '@/components/server/configuration/minecraftConfigs';
import classNames from 'classnames';
import styles from './style.module.css';

const DEFAULT_CONFIG_ID = MINECRAFT_CONFIGS[0].id;

const configIdFromSearch = (search: string): string | null => {
    const value = new URLSearchParams(search).get('file');

    if (value && getMinecraftConfigById(value)) {
        return value;
    }

    return null;
};

export default () => {
    const history = useHistory();
    const location = useLocation();
    const match = useRouteMatch<{ id: string }>('/server/:id');

    const activeConfigId = useMemo(
        () => configIdFromSearch(location.search) ?? DEFAULT_CONFIG_ID,
        [location.search]
    );

    const activeConfig = useMemo(
        () => getMinecraftConfigById(activeConfigId) ?? MINECRAFT_CONFIGS[0],
        [activeConfigId]
    );

    const selectConfig = useCallback(
        (configId: string) => {
            const base = `${match!.url.replace(/\/?$/, '')}/configuration`;
            const next = configId === DEFAULT_CONFIG_ID ? base : `${base}?file=${encodeURIComponent(configId)}`;

            if (`${location.pathname}${location.search}` !== next) {
                history.push(next);
            }
        },
        [history, location.pathname, location.search, match]
    );

    return (
        <ServerContentBlock title={'Configuration'}>
            <FlashMessageRender byKey={'server:configuration'} className={'mb-4'} />

            <div className={styles.layout}>
                <RealmCard bodyClassName={'p-3'}>
                    <div className={styles.sidebar}>
                        {CONFIG_CATEGORIES.map((category) => {
                            const configs = getConfigsByCategory(category.id);

                            return (
                                <section key={category.id} className={styles.categorySection}>
                                    <div className={styles.categoryHeader}>
                                        <h3 className={styles.categoryTitle}>{category.label}</h3>
                                        <p className={styles.categoryDescription}>{category.description}</p>
                                    </div>
                                    <div className={styles.fileList}>
                                        {configs.map((config) => {
                                            const isActive = config.id === activeConfig.id;

                                            return (
                                                <button
                                                    key={config.id}
                                                    type={'button'}
                                                    className={classNames(
                                                        styles.fileButton,
                                                        isActive && styles.fileButtonActive
                                                    )}
                                                    onClick={() => selectConfig(config.id)}
                                                >
                                                    <span className={styles.fileButtonLabel}>{config.label}</span>
                                                    <span className={styles.fileButtonPath}>{config.path}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                </RealmCard>

                <ConfigurationFileEditor key={activeConfig.id} config={activeConfig} />
            </div>
        </ServerContentBlock>
    );
};
