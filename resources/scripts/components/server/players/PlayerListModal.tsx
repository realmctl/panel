import React, { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import tw from 'twin.macro';
import Drawer from '@/components/elements/Drawer';
import { Button } from '@/components/elements/button/index';
import Spinner from '@/components/elements/Spinner';
import sendServerCommand from '@/api/server/sendServerCommand';
import { MinecraftOnlinePlayer, MinecraftServerStatus } from '@/api/server/players/getServerPlayers';
import { ServerContext } from '@/state/server';
import { usePermissions } from '@/plugins/usePermissions';
import useFlash from '@/plugins/useFlash';
import FlashMessageRender from '@/components/FlashMessageRender';
import { realmClasses } from '@/lib/realmTokens';
import {
    formatPlayerOnlineDuration,
    quoteMinecraftPlayer,
    resolvePlayerOnlineSeconds,
} from '@/components/server/players/playerSession';
import styles from './style.module.css';

const MODAL_POLL_MS = 10_000;
const TICK_MS = 1_000;

type PlayerAction = 'kick' | 'op' | 'deop' | 'ban';

const ACTION_COMMANDS: Record<PlayerAction, (name: string) => string> = {
    kick: (name) => `kick ${quoteMinecraftPlayer(name)}`,
    op: (name) => `op ${quoteMinecraftPlayer(name)}`,
    deop: (name) => `deop ${quoteMinecraftPlayer(name)}`,
    ban: (name) => `ban ${quoteMinecraftPlayer(name)}`,
};

const ACTION_LABELS: Record<PlayerAction, string> = {
    kick: 'Kick',
    op: 'Op',
    deop: 'Deop',
    ban: 'Ban',
};

interface Props {
    visible: boolean;
    onDismissed: () => void;
    status: MinecraftServerStatus | null;
    loading: boolean;
    onRefresh: () => void;
}

export default ({ visible, onDismissed, status, loading, onRefresh }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const powerStatus = ServerContext.useStoreState((state) => state.status.value);
    const [canSendCommands] = usePermissions(['control.console']);
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();

    const [seenSince, setSeenSince] = useState<Record<string, number>>({});
    const [pendingAction, setPendingAction] = useState<string | null>(null);
    const [tick, setTick] = useState(0);

    const players = status?.players;
    const list = players?.list ?? [];
    const canManage = canSendCommands && powerStatus === 'running';
    const serverOnline = status?.online ?? false;
    const onlineCount = players?.online ?? 0;
    const maxPlayers = players?.max ?? 0;

    const averagePing = useMemo(() => {
        const values = list.map((player) => player.ping).filter((value): value is number => value !== null);

        if (values.length === 0) {
            return null;
        }

        return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
    }, [list]);

    const subtitle = players
        ? `${onlineCount}${maxPlayers > 0 ? ` / ${maxPlayers}` : ''} online`
        : 'Live player list';

    useEffect(() => {
        if (!visible) {
            setSeenSince({});
            setPendingAction(null);
            return;
        }

        clearFlashes('server:players');
        onRefresh();
    }, [visible]);

    useEffect(() => {
        if (!visible) {
            return;
        }

        const interval = window.setInterval(onRefresh, MODAL_POLL_MS);

        return () => window.clearInterval(interval);
    }, [visible, onRefresh]);

    useEffect(() => {
        if (!visible) {
            return;
        }

        const interval = window.setInterval(() => setTick((value) => value + 1), TICK_MS);

        return () => window.clearInterval(interval);
    }, [visible]);

    useEffect(() => {
        if (!visible || list.length === 0) {
            return;
        }

        const now = Date.now();

        setSeenSince((previous) => {
            const next = { ...previous };
            let changed = false;

            list.forEach((player) => {
                if (!next[player.name]) {
                    next[player.name] = now;
                    changed = true;
                }
            });

            return changed ? next : previous;
        });
    }, [list, visible]);

    const hasJoinMetadata = useMemo(
        () => list.some((player) => player.joinedAt || (player.ping !== null && player.ping !== undefined)),
        [list]
    );

    const runAction = (player: MinecraftOnlinePlayer, action: PlayerAction) => {
        if (!canManage) {
            return;
        }

        setPendingAction(`${action}:${player.name}`);
        clearFlashes('server:players');

        sendServerCommand(uuid, ACTION_COMMANDS[action](player.name))
            .then(() => {
                addFlash({
                    key: 'server:players',
                    type: 'success',
                    message: `Sent ${action} for ${player.name}.`,
                });
                window.setTimeout(onRefresh, 750);
            })
            .catch((error) => clearAndAddHttpError({ key: 'server:players', error }))
            .finally(() => setPendingAction(null));
    };

    const renderDuration = (player: MinecraftOnlinePlayer) => {
        void tick;

        return formatPlayerOnlineDuration(resolvePlayerOnlineSeconds(player, seenSince));
    };

    return (
        <Drawer
            visible={visible}
            onDismissed={onDismissed}
            title={'Online Players'}
            subtitle={subtitle}
            width={'34rem'}
        >
            <div className={'relative flex flex-col min-h-full'}>
                <FlashMessageRender byKey={'server:players'} css={tw`mb-4`} />

                {players && (
                    <div
                        className={classNames(
                            'grid grid-cols-3 gap-3 p-3 rounded-lg mb-4 text-center',
                            realmClasses.insetPanel
                        )}
                    >
                        <div>
                            <p className={'text-[11px] uppercase tracking-wide text-neutral-500 m-0'}>Online</p>
                            <p className={'text-sm font-semibold text-neutral-100 mt-1 mb-0 tabular-nums'}>{onlineCount}</p>
                        </div>
                        <div>
                            <p className={'text-[11px] uppercase tracking-wide text-neutral-500 m-0'}>Capacity</p>
                            <p className={'text-sm font-semibold text-neutral-100 mt-1 mb-0 tabular-nums'}>
                                {maxPlayers > 0 ? maxPlayers : '—'}
                            </p>
                        </div>
                        <div>
                            <p className={'text-[11px] uppercase tracking-wide text-neutral-500 m-0'}>Avg ping</p>
                            <p className={'text-sm font-semibold text-neutral-100 mt-1 mb-0 tabular-nums'}>
                                {averagePing !== null ? `${averagePing} ms` : '—'}
                            </p>
                        </div>
                    </div>
                )}

                {loading && list.length === 0 ? (
                    <div className={'py-12'}>
                        <Spinner centered size={'large'} />
                    </div>
                ) : !serverOnline && list.length === 0 ? (
                    <div className={'flex flex-col items-center justify-center py-16'}>
                        <h3 className={'text-lg font-semibold text-neutral-100 mb-1'}>Server unreachable</h3>
                        <p className={'text-sm text-neutral-400 text-center max-w-sm m-0'}>
                            The server appears offline or the status query could not reach it.
                        </p>
                    </div>
                ) : list.length === 0 ? (
                    <div className={'flex flex-col items-center justify-center py-16'}>
                        <h3 className={'text-lg font-semibold text-neutral-100 mb-1'}>No players online</h3>
                        <p className={'text-sm text-neutral-400 text-center max-w-sm m-0'}>
                            Players will show up here as soon as someone joins the server.
                        </p>
                    </div>
                ) : (
                    <div className={'space-y-2'}>
                        {list.map((player) => {
                            const rowBusy = pendingAction?.endsWith(`:${player.name}`) ?? false;

                            return (
                                <div
                                    key={player.uuid ?? player.name}
                                    className={classNames('rounded-lg p-3', realmClasses.row)}
                                >
                                    <div className={'flex items-center gap-3'}>
                                        <span className={styles.player_avatar} style={{ width: 36, height: 36, marginLeft: 0 }}>
                                            <img
                                                src={player.avatar.head}
                                                alt={player.name}
                                                width={36}
                                                height={36}
                                                className={styles.player_avatar_img}
                                                loading={'lazy'}
                                                decoding={'async'}
                                            />
                                        </span>
                                        <div className={'flex-1 min-w-0'}>
                                            <p className={'text-sm font-medium text-neutral-100 m-0 truncate'}>
                                                {player.name}
                                            </p>
                                            <p className={'text-xs text-neutral-500 mt-0.5 mb-0'}>
                                                {player.ping != null ? `${player.ping} ms` : 'Ping —'}
                                                <span className={'text-neutral-700 mx-1.5'}>•</span>
                                                {renderDuration(player)}
                                            </p>
                                        </div>
                                    </div>

                                    {canSendCommands && (
                                        <div className={'flex flex-wrap gap-2 mt-3 pt-3 border-t border-realm-border/40'}>
                                            {(['kick', 'ban'] as PlayerAction[]).map((action) => (
                                                <Button.Danger
                                                    key={action}
                                                    type={'button'}
                                                    size={Button.Sizes.Small}
                                                    disabled={!canManage || rowBusy}
                                                    onClick={() => runAction(player, action)}
                                                >
                                                    {ACTION_LABELS[action]}
                                                </Button.Danger>
                                            ))}
                                            {(['op', 'deop'] as PlayerAction[]).map((action) => (
                                                <Button
                                                    key={action}
                                                    type={'button'}
                                                    size={Button.Sizes.Small}
                                                    variant={Button.Variants.Secondary}
                                                    disabled={!canManage || rowBusy}
                                                    onClick={() => runAction(player, action)}
                                                >
                                                    {ACTION_LABELS[action]}
                                                </Button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {!canManage && canSendCommands && powerStatus !== 'running' && (
                    <div
                        className={classNames(
                            'flex items-center gap-2 p-3 rounded-lg text-xs text-neutral-500 mt-4',
                            realmClasses.insetPanel
                        )}
                    >
                        Start the server to run player commands.
                    </div>
                )}

                {!hasJoinMetadata && list.length > 0 && (
                    <div
                        className={classNames(
                            'flex items-center gap-2 p-3 rounded-lg text-xs text-neutral-500 mt-4',
                            realmClasses.insetPanel
                        )}
                    >
                        Ping and session duration are estimated when the status API does not provide them.
                    </div>
                )}

                <div css={tw`mt-6 pt-4 border-t border-realm-border flex justify-between gap-3`}>
                    <Button.Text size={Button.Sizes.Small} onClick={onRefresh} disabled={loading}>
                        Refresh
                    </Button.Text>
                    <Button.Text size={Button.Sizes.Small} onClick={onDismissed}>
                        Close
                    </Button.Text>
                </div>
            </div>
        </Drawer>
    );
};
