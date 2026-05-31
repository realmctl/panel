import React, { memo, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Server } from '@/api/server/getServer';
import getServerResourceUsage, { ServerPowerState, ServerStats } from '@/api/server/getServerResourceUsage';
import { bytesToString, ip, mbToBytes } from '@/lib/formatters';
import Spinner from '@/components/elements/Spinner';

type Timer = ReturnType<typeof setInterval>;

// Map egg name to background image
const getServerBackground = (server: Server): string => {
    // Use the egg's configured background if set
    if (server.eggBackground) {
        return `/assets/backgrounds/${server.eggBackground}`;
    }

    // Fallback: detect from egg name
    const egg = server.eggName.toLowerCase();

    if (egg.includes('minecraft')) return '/assets/backgrounds/minecraft.png';
    if (egg.includes('rust')) return '/assets/backgrounds/rust.jpg';
    if (egg.includes('valheim')) return '/assets/backgrounds/valheim.jpeg';
    if (egg.includes('ark')) return '/assets/backgrounds/ark.webp';
    if (egg.includes('terraria')) return '/assets/backgrounds/terraria.jpg';
    if (egg.includes('csgo') || egg.includes('cs2') || egg.includes('counter-strike') || egg.includes('counter strike')) return '/assets/backgrounds/csgo.jpg';
    if (egg.includes('gmod') || egg.includes('garry')) return '/assets/backgrounds/gmod.jpeg';
    if (egg.includes('fivem')) return '/assets/backgrounds/fivem.jpeg';

    // Fallback: check docker image
    const image = server.dockerImage.toLowerCase();
    if (image.includes('minecraft')) return '/assets/backgrounds/minecraft.png';
    if (image.includes('rust')) return '/assets/backgrounds/rust.jpg';
    if (image.includes('valheim')) return '/assets/backgrounds/valheim.jpeg';
    if (image.includes('ark')) return '/assets/backgrounds/ark.webp';
    if (image.includes('terraria')) return '/assets/backgrounds/terraria.jpg';
    if (image.includes('csgo') || image.includes('cs2')) return '/assets/backgrounds/csgo.jpg';
    if (image.includes('gmod')) return '/assets/backgrounds/gmod.jpeg';
    if (image.includes('fivem')) return '/assets/backgrounds/fivem.jpeg';

    return '/assets/backgrounds/minecraft.png';
};

const getServerType = (server: Server): string => {
    // Use the egg name directly as the server type
    if (server.eggName) return server.eggName;
    return 'Game Server';
};

const StatusBadge = ({ status }: { status: ServerPowerState | 'suspended' | 'installing' | 'transferring' | undefined }) => {
    if (!status) return null;

    const config: Record<string, { bg: string; text: string; label: string }> = {
        running: { bg: 'bg-green-500', text: 'text-white', label: 'ONLINE' },
        offline: { bg: 'bg-red-500', text: 'text-white', label: 'OFFLINE' },
        starting: { bg: 'bg-yellow-500', text: 'text-white', label: 'STARTING' },
        stopping: { bg: 'bg-yellow-500', text: 'text-white', label: 'STOPPING' },
        suspended: { bg: 'bg-red-600', text: 'text-white', label: 'SUSPENDED' },
        installing: { bg: 'bg-neutral-500', text: 'text-white', label: 'INSTALLING' },
        transferring: { bg: 'bg-neutral-500', text: 'text-white', label: 'TRANSFERRING' },
    };

    const c = config[status] || { bg: 'bg-neutral-500', text: 'text-white', label: 'UNKNOWN' };

    return (
        <span className={`${c.bg} ${c.text} text-xs font-bold px-2.5 py-1 rounded`}>
            {c.label}
        </span>
    );
};

export default ({ server }: { server: Server }) => {
    const interval = useRef<Timer>(null) as React.MutableRefObject<Timer>;
    const [isSuspended, setIsSuspended] = useState(server.status === 'suspended');
    const [stats, setStats] = useState<ServerStats | null>(null);

    const getStats = () =>
        getServerResourceUsage(server.uuid)
            .then((data) => setStats(data))
            .catch((error) => console.error(error));

    useEffect(() => {
        setIsSuspended(stats?.isSuspended || server.status === 'suspended');
    }, [stats?.isSuspended, server.status]);

    useEffect(() => {
        if (isSuspended) return;

        getStats().then(() => {
            interval.current = setInterval(() => getStats(), 30000);
        });

        return () => {
            interval.current && clearInterval(interval.current);
        };
    }, [isSuspended]);

    const backgroundImage = getServerBackground(server);
    const serverType = getServerType(server);

    const currentStatus = isSuspended
        ? 'suspended'
        : server.isTransferring
        ? 'transferring'
        : server.status === 'installing'
        ? 'installing'
        : stats?.status;

    const allocation = server.allocations.find((alloc) => alloc.isDefault);
    const address = allocation ? `${allocation.alias || ip(allocation.ip)}:${allocation.port}` : '--';

    const cpuDisplay = stats ? `${stats.cpuUsagePercent.toFixed(0)}%` : '--';
    const memoryDisplay = stats ? bytesToString(stats.memoryUsageInBytes) : '--';
    const diskDisplay = stats ? bytesToString(stats.diskUsageInBytes) : '--';

    return (
        <div className={'rounded-md overflow-hidden border border-[#2d3338]/50 group'} style={{ backgroundColor: '#192024' }}>
            {/* Banner image that covers the top half and fades into card */}
            <div className={'relative overflow-hidden'}>
                {/* Image covers full width, extends behind the content */}
                <div
                    className={'absolute inset-0 bg-cover bg-center'}
                    style={{ backgroundImage: `url(${backgroundImage})`, height: '160px' }}
                />
                {/* Gradient: transparent at top, fades to card color */}
                <div
                    className={'absolute inset-0 pointer-events-none'}
                    style={{ height: '160px', background: 'linear-gradient(to bottom, rgba(25, 32, 36, 0.1) 0%, rgba(25, 32, 36, 0.4) 35%, rgba(25, 32, 36, 0.85) 65%, rgba(25, 32, 36, 1) 100%)' }}
                />

                {/* Content overlaid on the image/gradient */}
                <div className={'relative px-5 pt-5 pb-5'}>
                    {/* Header: Name + Status */}
                    <div className={'flex items-start justify-between mb-6'}>
                        <div>
                            <h3 className={'text-white text-lg font-semibold m-0'}>{server.name}</h3>
                            <p className={'text-neutral-300 text-sm m-0 mt-0.5'}>{serverType}</p>
                        </div>
                        <StatusBadge status={currentStatus} />
                    </div>

                    {/* Stats */}
                    <div className={'grid grid-cols-2 gap-x-4 gap-y-2 mb-4'}>
                        <div>
                            <span className={'text-neutral-400 text-xs'}>IP: </span>
                            <span className={'text-neutral-100 text-xs font-medium'}>{address}</span>
                        </div>
                        <div>
                            <span className={'text-neutral-400 text-xs'}>CPU: </span>
                            <span className={'text-neutral-100 text-xs font-medium'}>{cpuDisplay}</span>
                        </div>
                        <div>
                            <span className={'text-neutral-400 text-xs'}>RAM: </span>
                            <span className={'text-neutral-100 text-xs font-medium'}>{memoryDisplay}</span>
                        </div>
                        <div>
                            <span className={'text-neutral-400 text-xs'}>Storage: </span>
                            <span className={'text-neutral-100 text-xs font-medium'}>{diskDisplay}</span>
                        </div>
                    </div>

                    {/* Manage button */}
                    <Link
                        to={`/server/${server.id}`}
                        className={`block w-full text-center py-2.5 rounded-md text-sm font-medium no-underline transition-all duration-150 border ${
                            isSuspended
                                ? 'bg-red-500/20 hover:bg-red-500/40 text-red-200 border-red-500/30'
                                : 'bg-[#1e2a30] hover:bg-[#243238] text-neutral-200 border-[#2d3338]'
                        }`}
                    >
                        {isSuspended ? 'Suspended' : 'Manage server'}
                    </Link>
                </div>
            </div>
        </div>
    );
};
