import React, { memo, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Server } from '@/api/server/getServer';
import getServerResourceUsage, { ServerPowerState, ServerStats } from '@/api/server/getServerResourceUsage';
import { bytesToString, ip, mbToBytes } from '@/lib/formatters';
import Spinner from '@/components/elements/Spinner';

type Timer = ReturnType<typeof setInterval>;

// Map server type keywords to background images
const getServerBackground = (server: Server): string => {
    const image = server.dockerImage.toLowerCase();
    const name = server.name.toLowerCase();
    const features = server.eggFeatures.map((f) => f.toLowerCase());

    if (image.includes('minecraft') || name.includes('minecraft') || features.includes('minecraft')) {
        return 'https://cdn.ordnary.com/realmctl/backgrounds/minecraft.jpg';
    }
    if (image.includes('rust') || name.includes('rust') || features.includes('rust')) {
        return 'https://cdn.ordnary.com/realmctl/backgrounds/rust.jpg';
    }
    if (image.includes('valheim') || name.includes('valheim') || features.includes('valheim')) {
        return 'https://cdn.ordnary.com/realmctl/backgrounds/valheim.jpg';
    }
    if (image.includes('ark') || name.includes('ark') || features.includes('ark')) {
        return 'https://cdn.ordnary.com/realmctl/backgrounds/ark.jpg';
    }
    if (image.includes('terraria') || name.includes('terraria') || features.includes('terraria')) {
        return 'https://cdn.ordnary.com/realmctl/backgrounds/terraria.jpg';
    }
    if (image.includes('csgo') || image.includes('cs2') || name.includes('csgo') || name.includes('cs2') || features.includes('csgo')) {
        return 'https://cdn.ordnary.com/realmctl/backgrounds/csgo.jpg';
    }
    if (image.includes('gmod') || image.includes('garrysmod') || name.includes('gmod') || features.includes('gmod')) {
        return 'https://cdn.ordnary.com/realmctl/backgrounds/gmod.jpg';
    }
    if (image.includes('fivem') || name.includes('fivem') || features.includes('fivem')) {
        return 'https://cdn.ordnary.com/realmctl/backgrounds/fivem.jpg';
    }
    // Default fallback
    return 'https://cdn.ordnary.com/realmctl/backgrounds/default.jpg';
};

const getServerType = (server: Server): string => {
    const image = server.dockerImage.toLowerCase();
    const name = server.name.toLowerCase();
    const features = server.eggFeatures.map((f) => f.toLowerCase());

    if (image.includes('minecraft') || name.includes('minecraft') || features.includes('minecraft')) return 'Minecraft Server';
    if (image.includes('rust') || name.includes('rust') || features.includes('rust')) return 'Rust Server';
    if (image.includes('valheim') || name.includes('valheim') || features.includes('valheim')) return 'Valheim Server';
    if (image.includes('ark') || name.includes('ark') || features.includes('ark')) return 'ARK Server';
    if (image.includes('terraria') || name.includes('terraria') || features.includes('terraria')) return 'Terraria Server';
    if (image.includes('csgo') || image.includes('cs2') || name.includes('csgo') || name.includes('cs2')) return 'CS2 Server';
    if (image.includes('gmod') || image.includes('garrysmod') || name.includes('gmod')) return 'GMod Server';
    if (image.includes('fivem') || name.includes('fivem') || features.includes('fivem')) return 'FiveM Server';
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
        <div className={'relative rounded-xl overflow-hidden border border-[#2d3338]/50 group'}>
            {/* Background image */}
            <div
                className={'absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity duration-300'}
                style={{ backgroundImage: `url(${backgroundImage})` }}
            />
            {/* Dark overlay */}
            <div className={'absolute inset-0'} style={{ backgroundColor: 'rgba(15, 23, 30, 0.75)' }} />

            {/* Content */}
            <div className={'relative p-5'}>
                {/* Header: Name + Status */}
                <div className={'flex items-start justify-between mb-3'}>
                    <div>
                        <h3 className={'text-white text-lg font-semibold m-0'}>{server.name}</h3>
                        <p className={'text-neutral-400 text-sm m-0 mt-0.5'}>{serverType}</p>
                    </div>
                    <StatusBadge status={currentStatus} />
                </div>

                {/* Stats */}
                <div className={'grid grid-cols-2 gap-x-4 gap-y-2 mt-4 mb-4'}>
                    <div>
                        <span className={'text-neutral-400 text-xs'}>IP: </span>
                        <span className={'text-neutral-200 text-xs'}>{address}</span>
                    </div>
                    <div>
                        <span className={'text-neutral-400 text-xs'}>CPU: </span>
                        <span className={'text-neutral-200 text-xs'}>{cpuDisplay}</span>
                    </div>
                    <div>
                        <span className={'text-neutral-400 text-xs'}>RAM: </span>
                        <span className={'text-neutral-200 text-xs'}>{memoryDisplay}</span>
                    </div>
                    <div>
                        <span className={'text-neutral-400 text-xs'}>Storage: </span>
                        <span className={'text-neutral-200 text-xs'}>{diskDisplay}</span>
                    </div>
                </div>

                {/* Manage button */}
                <Link
                    to={`/server/${server.id}`}
                    className={`block w-full text-center py-2.5 rounded-lg text-sm font-medium no-underline transition-all duration-150 ${
                        isSuspended
                            ? 'bg-red-500/80 hover:bg-red-500 text-white'
                            : 'bg-blue-500/80 hover:bg-blue-500 text-white'
                    }`}
                >
                    {isSuspended ? 'Suspended' : 'Manage Server'}
                </Link>
            </div>
        </div>
    );
};
