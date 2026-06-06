import React, { useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';
import { faCube, faWifi } from '@fortawesome/free-solid-svg-icons';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import CopyOnClick from '@/components/elements/CopyOnClick';
import Icon from '@/components/elements/Icon';
import getServerPlayers, { MinecraftOnlinePlayer, MinecraftServerStatus } from '@/api/server/players/getServerPlayers';
import { ServerContext } from '@/state/server';
import { usePermissions } from '@/plugins/usePermissions';
import { serverSupportsPlayers } from '@/lib/minecraftEgg';
import {
    MOCK_SERVER_STATUS,
    USE_MOCK_PLAYER_DATA,
} from '@/components/server/players/mockPlayerData';
import {
    formatMinecraftVersion,
    getServerConnectionAddress,
    resolveServerDisplayStatus,
} from '@/components/server/players/serverHeaderMeta';
import styles from './style.module.css';

const POLL_INTERVAL_MS = 30_000;
const MAX_VISIBLE = 3;
const AVATAR_SIZE = 22;

const MetaSeparator = () => <span className={styles.meta_sep}>•</span>;

export default () => {
    const server = ServerContext.useStoreState((state) => state.server.data!);
    const uuid = server.uuid;
    const eggName = server.eggName;
    const eggCategory = server.eggCategory;
    const powerStatus = ServerContext.useStoreState((state) => state.status.value);
    const [canRead] = usePermissions(['players.read']);

    const [liveStatus, setLiveStatus] = useState<MinecraftServerStatus | null>(null);
    const [loading, setLoading] = useState(true);

    const isMinecraft = serverSupportsPlayers(eggName, eggCategory);
    const showPlayers = isMinecraft && canRead;

    const fetchPlayers = useCallback(() => {
        if (!showPlayers) {
            setLoading(false);
            return;
        }

        if (USE_MOCK_PLAYER_DATA) {
            setLiveStatus(MOCK_SERVER_STATUS);
            setLoading(false);
            return;
        }

        getServerPlayers(uuid)
            .then((status) => {
                setLiveStatus(status);
            })
            .catch(() => {
                setLiveStatus(null);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [showPlayers, uuid]);

    useEffect(() => {
        setLoading(showPlayers);
        fetchPlayers();
    }, [fetchPlayers, showPlayers]);

    useEffect(() => {
        if (!showPlayers) {
            return;
        }

        const interval = window.setInterval(fetchPlayers, POLL_INTERVAL_MS);

        return () => window.clearInterval(interval);
    }, [fetchPlayers, showPlayers]);

    useEffect(() => {
        if (!showPlayers || powerStatus !== 'running') {
            return;
        }

        fetchPlayers();
    }, [fetchPlayers, powerStatus, showPlayers]);

    const displayStatus = resolveServerDisplayStatus(powerStatus, server);
    const players = liveStatus?.players ?? null;
    const versionLabel = isMinecraft ? formatMinecraftVersion(liveStatus) : null;

    const list = players?.list ?? [];
    const visible = list.slice(0, MAX_VISIBLE);
    const overflow = list.slice(MAX_VISIBLE);

    const statusClass = styles[`meta_status_${displayStatus.tone}`] ?? styles.meta_status_neutral;
    const statusDotClass = styles[`meta_status_dot_${displayStatus.tone}`] ?? styles.meta_status_dot_neutral;
    const hasPlayerSection = showPlayers && !!players;
    const connectionAddress = getServerConnectionAddress(server);
    const hasPlayerContent = showPlayers && (loading || hasPlayerSection);
    const hasContentBeforeStatus = !!connectionAddress || hasPlayerContent;

    return (
        <div className={styles.players_meta}>
            {connectionAddress && (
                <CopyOnClick text={connectionAddress}>
                    <span className={styles.meta_item}>
                        <Icon icon={faWifi} className={styles.meta_icon} />
                        <span className={styles.meta_address}>{connectionAddress}</span>
                    </span>
                </CopyOnClick>
            )}

            {connectionAddress && hasPlayerContent && <MetaSeparator />}

            {showPlayers && loading && !players && (
                <span className={styles.meta_text}>Loading players...</span>
            )}

            {showPlayers && players && (
                <>
                    {visible.length > 0 && (
                        <span className={styles.players_stack}>
                            {visible.map((player: MinecraftOnlinePlayer, index) => (
                                <Tooltip
                                    key={`${player.uuid ?? player.name}:${index}`}
                                    content={player.name}
                                    placement={'top'}
                                    delay={{ open: 0, close: 80 }}
                                >
                                    <span
                                        className={styles.player_avatar}
                                        style={{
                                            width: AVATAR_SIZE,
                                            height: AVATAR_SIZE,
                                            zIndex: visible.length - index,
                                        }}
                                    >
                                        <img
                                            src={player.avatar.head}
                                            alt={player.name}
                                            width={AVATAR_SIZE}
                                            height={AVATAR_SIZE}
                                            className={styles.player_avatar_img}
                                            loading={'lazy'}
                                            decoding={'async'}
                                        />
                                    </span>
                                </Tooltip>
                            ))}
                            {overflow.length > 0 && (
                                <Tooltip
                                    content={
                                        <div className={'flex flex-col gap-1 text-left'}>
                                            {overflow.map((player) => (
                                                <span
                                                    key={player.uuid ?? player.name}
                                                    className={'text-xs text-neutral-100'}
                                                >
                                                    {player.name}
                                                </span>
                                            ))}
                                        </div>
                                    }
                                    placement={'top'}
                                    flip={false}
                                    delay={{ open: 0, close: 80 }}
                                >
                                    <span
                                        className={classNames(styles.players_overflow)}
                                        style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
                                    >
                                        +{overflow.length}
                                    </span>
                                </Tooltip>
                            )}
                        </span>
                    )}

                    <span className={styles.players_count}>
                        {players.online}
                        {players.max > 0 ? ` / ${players.max}` : ''} online
                    </span>

                    {versionLabel && (
                        <>
                            <MetaSeparator />
                            <span className={styles.meta_item}>
                                <Icon icon={faCube} className={styles.meta_icon} />
                                <span className={styles.meta_text}>{versionLabel}</span>
                            </span>
                        </>
                    )}
                </>
            )}

            {hasContentBeforeStatus && <MetaSeparator />}

            <span className={styles.meta_status_wrap}>
                <span className={classNames(styles.meta_status_dot, statusDotClass)} aria-hidden={'true'} />
                <span className={classNames(styles.meta_text, statusClass)}>{displayStatus.label}</span>
            </span>
        </div>
    );
};
