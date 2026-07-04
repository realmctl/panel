import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    IconDefinition,
    faClock,
    faHdd,
    faMapMarkerAlt,
    faMemory,
    faMicrochip,
} from '@fortawesome/free-solid-svg-icons';
import { ServerContext } from '@/state/server';
import { SocketEvent, SocketRequest } from '@/components/server/events';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import { bytesToString, mbToBytes } from '@/lib/formatters';
import { capitalize } from '@/lib/strings';
import UptimeDuration from '@/components/server/UptimeDuration';
import { countryFlagUrl, formatGeoLocationLabel } from '@/lib/countryFlag';

type Stats = Record<'memory' | 'cpu' | 'disk' | 'uptime', number>;

interface TileProps {
    icon: IconDefinition;
    label: string;
    sub: React.ReactNode;
    barUsed?: number;
    barLimit?: number;
    children: React.ReactNode;
}

const RING_SIZE = 28;
const RING_STROKE = 3;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const CircularProgress = ({ percent, color }: { percent: number; color: string }) => {
    const offset = RING_CIRCUMFERENCE - (Math.min(percent, 100) / 100) * RING_CIRCUMFERENCE;

    return (
        <svg width={RING_SIZE} height={RING_SIZE} className={'-rotate-90 flex-shrink-0'}>
            <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                strokeWidth={RING_STROKE}
                fill={'none'}
                className={'stroke-realm-border/40'}
            />
            <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                strokeWidth={RING_STROKE}
                fill={'none'}
                strokeLinecap={'round'}
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={offset}
                stroke={color}
                className={'transition-all duration-500'}
            />
        </svg>
    );
};

const Tile = ({ icon, label, sub, barUsed, barLimit, children }: TileProps) => {
    const delta = barLimit ? barUsed! / barLimit : 0;
    const ringColor = delta > 0.9 ? '#f87171' : delta > 0.8 ? '#fbbf24' : '#9ca3af';

    return (
        <div className={'bg-realm-card border border-realm-border/50 rounded-md px-4 py-3 min-w-0 flex flex-col'}>
            <div className={'flex items-center justify-between gap-2 mb-1.5 min-h-[28px]'}>
                <div className={'flex items-center gap-2 min-w-0'}>
                    <FontAwesomeIcon icon={icon} className={'w-3.5 h-3.5 text-neutral-500 flex-shrink-0'} fixedWidth />
                    <span className={'text-xs font-medium text-neutral-500 truncate'}>{label}</span>
                </div>
                {!!barLimit && <CircularProgress percent={delta * 100} color={ringColor} />}
            </div>
            <div className={'text-sm font-medium text-neutral-100 truncate'}>{children}</div>
            <div className={'text-xs text-neutral-500 truncate mt-0.5'}>{sub}</div>
        </div>
    );
};

const OverviewStats = ({ className }: { className?: string }) => {
    const [stats, setStats] = useState<Stats>({ memory: 0, cpu: 0, disk: 0, uptime: 0 });

    const status = ServerContext.useStoreState((state) => state.status.value);
    const connected = ServerContext.useStoreState((state) => state.socket.connected);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);
    const limits = ServerContext.useStoreState((state) => state.server.data!.limits);
    const nodeName = ServerContext.useStoreState((state) => state.server.data!.node);
    const nodeLocation = ServerContext.useStoreState((state) => state.server.data!.nodeLocation);

    const nodeFlagUrl = countryFlagUrl(nodeLocation?.countryCode);
    const nodeLocationLabel = formatGeoLocationLabel(nodeLocation);

    useEffect(() => {
        if (!connected || !instance) {
            return;
        }

        instance.send(SocketRequest.SEND_STATS);
    }, [instance, connected]);

    useWebsocketEvent(SocketEvent.STATS, (data) => {
        let parsed: any = {};
        try {
            parsed = JSON.parse(data);
        } catch (e) {
            return;
        }

        setStats({
            memory: parsed.memory_bytes,
            cpu: parsed.cpu_absolute,
            disk: parsed.disk_bytes,
            uptime: parsed.uptime || 0,
        });
    });

    const isOffline = status === 'offline' || status === null;
    const offlineValue = <span className={'text-neutral-600'}>Offline</span>;

    return (
        <div className={classNames('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3', className)}>
            <Tile icon={faClock} label={'Uptime'} sub={'Since last start'}>
                {status === 'running' && stats.uptime > 0 ? (
                    <UptimeDuration uptime={stats.uptime / 1000} />
                ) : status && status !== 'offline' ? (
                    capitalize(status)
                ) : (
                    offlineValue
                )}
            </Tile>

            <Tile
                icon={faMicrochip}
                label={'CPU'}
                sub={limits.cpu ? `of ${limits.cpu}%` : 'Unlimited'}
                barUsed={stats.cpu}
                barLimit={limits.cpu}
            >
                {isOffline ? offlineValue : `${stats.cpu.toFixed(2)}%`}
            </Tile>

            <Tile
                icon={faMemory}
                label={'Memory'}
                sub={limits.memory ? `of ${bytesToString(mbToBytes(limits.memory))}` : 'Unlimited'}
                barUsed={stats.memory}
                barLimit={mbToBytes(limits.memory)}
            >
                {isOffline ? offlineValue : bytesToString(stats.memory)}
            </Tile>

            <Tile
                icon={faHdd}
                label={'Disk'}
                sub={limits.disk ? `of ${bytesToString(mbToBytes(limits.disk))}` : 'Unlimited'}
                barUsed={stats.disk}
                barLimit={mbToBytes(limits.disk)}
            >
                {bytesToString(stats.disk)}
            </Tile>

            <Tile icon={faMapMarkerAlt} label={'Location'} sub={nodeName}>
                <span className={'flex items-center gap-1.5'}>
                    {nodeFlagUrl && (
                        <img
                            src={nodeFlagUrl}
                            alt={nodeLocationLabel || nodeLocation?.country || ''}
                            title={nodeLocationLabel || undefined}
                            width={16}
                            height={12}
                            className={'w-4 h-auto rounded-sm object-cover flex-shrink-0'}
                            loading={'lazy'}
                            decoding={'async'}
                        />
                    )}
                    <span className={'truncate'}>{nodeLocationLabel || 'Unknown location'}</span>
                </span>
            </Tile>
        </div>
    );
};

export default OverviewStats;
