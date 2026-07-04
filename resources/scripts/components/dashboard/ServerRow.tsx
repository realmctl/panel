import React, { memo, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import classNames from 'classnames';
import isEqual from 'react-fast-compare';
import { Server } from '@/api/server/getServer';
import getServerResourceUsage, { ServerPowerState } from '@/api/server/getServerResourceUsage';
import getServerPlayers from '@/api/server/players/getServerPlayers';
import { bytesToString, mbToBytes } from '@/lib/formatters';
import { serverSupportsPlayers } from '@/lib/minecraftEgg';
import { resolveColor } from '@/components/dashboard/groups/GroupColorDot';

type Timer = ReturnType<typeof setInterval>;

const STATUS_STYLE: Record<string, string> = {
    running: 'bg-green-500/15 text-green-400',
    offline: 'bg-red-500/15 text-red-400',
    starting: 'bg-yellow-500/15 text-yellow-400',
    stopping: 'bg-yellow-500/15 text-yellow-400',
};

const statusLabel = (status: ServerPowerState | undefined, suspended: boolean): string => {
    if (suspended) return 'Suspended';
    if (!status || status === 'offline') return 'Offline';
    return status.charAt(0).toUpperCase() + status.slice(1);
};

export default ({ server, className, groupColor }: { server: Server; className?: string; groupColor?: string }) => {
    const interval = useRef<Timer>(null) as React.MutableRefObject<Timer>;
    const [isSuspended, setIsSuspended] = useState(server.status === 'suspended');
    const [status, setStatus] = useState<ServerPowerState | undefined>(undefined);
    const [players, setPlayers] = useState<{ online: number; max: number } | null>(null);

    const showPlayers = serverSupportsPlayers(server.eggName, server.eggCategory);

    useEffect(() => {
        if (isSuspended) return;

        const getStats = () =>
            getServerResourceUsage(server.uuid)
                .then((data) => {
                    setStatus(data.status);
                    setIsSuspended(data.isSuspended);
                })
                .catch(() => undefined);

        getStats().then(() => {
            interval.current = setInterval(getStats, 30000);
        });

        return () => {
            interval.current && clearInterval(interval.current);
        };
    }, [isSuspended, server.uuid]);

    useEffect(() => {
        if (!showPlayers || status !== 'running') {
            setPlayers(null);
            return;
        }

        const getPlayers = () =>
            getServerPlayers(server.uuid)
                .then((data) => setPlayers({ online: data.players.online, max: data.players.max }))
                .catch(() => setPlayers(null));

        getPlayers();
        const playersInterval = setInterval(getPlayers, 30000);

        return () => clearInterval(playersInterval);
    }, [showPlayers, status, server.uuid]);

    const memoryLimit = server.limits.memory !== 0 ? bytesToString(mbToBytes(server.limits.memory)) : 'Unlimited';
    const resolvedGroupColor = groupColor ? resolveColor(groupColor) : undefined;

    return (
        <Link
            to={`/server/${server.id}`}
            className={classNames(
                'grid grid-cols-12 gap-4 items-center px-4 py-3 no-underline transition-colors duration-150 hover:bg-white/[0.03]',
                className
            )}
            style={resolvedGroupColor ? { borderLeft: `3px solid ${resolvedGroupColor}55` } : undefined}
        >
            <div className={'col-span-12 sm:col-span-4 min-w-0'}>
                <p className={'text-sm font-medium text-neutral-100 truncate m-0'}>{server.name}</p>
                {!!server.description && (
                    <p className={'text-xs text-neutral-500 truncate m-0 mt-0.5'}>{server.description}</p>
                )}
            </div>
            <div className={'hidden sm:block sm:col-span-2 text-sm text-neutral-400 truncate'}>
                {server.eggName || 'N/A'}
            </div>
            <div className={'col-span-6 sm:col-span-2'}>
                <span
                    className={classNames(
                        'inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide',
                        isSuspended ? STATUS_STYLE.offline : STATUS_STYLE[status ?? 'offline']
                    )}
                >
                    {statusLabel(status, isSuspended)}
                </span>
            </div>
            <div className={'hidden sm:block sm:col-span-2 text-sm text-neutral-300'}>{memoryLimit}</div>
            <div className={'col-span-6 sm:col-span-1 text-sm text-neutral-300 truncate'}>
                {showPlayers && players ? `${players.online}/${players.max} players` : 'N/A'}
            </div>
            <div className={'hidden sm:flex sm:col-span-1 justify-end'}>
                <FontAwesomeIcon icon={faEllipsisV} className={'text-neutral-600'} />
            </div>
        </Link>
    );
};
