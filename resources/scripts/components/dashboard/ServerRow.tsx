import React, { memo, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEthernet, faHdd, faMemory, faMicrochip, faServer } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { Server } from '@/api/server/getServer';
import getServerResourceUsage, { ServerPowerState, ServerStats } from '@/api/server/getServerResourceUsage';
import { bytesToString, ip, mbToBytes } from '@/lib/formatters';
import tw from 'twin.macro';
import GreyRowBox from '@/components/elements/GreyRowBox';
import Spinner from '@/components/elements/Spinner';
import styled from 'styled-components/macro';
import isEqual from 'react-fast-compare';

const getServerBackground = (server: Server): string => {
    if (server.eggBackground) return `/assets/backgrounds/${server.eggBackground}`;
    const egg = server.eggName.toLowerCase();
    if (egg.includes('minecraft')) return '/assets/backgrounds/minecraft.png';
    if (egg.includes('rust')) return '/assets/backgrounds/rust.jpg';
    if (egg.includes('valheim')) return '/assets/backgrounds/valheim.jpeg';
    if (egg.includes('ark')) return '/assets/backgrounds/ark.webp';
    if (egg.includes('terraria')) return '/assets/backgrounds/terraria.jpg';
    if (egg.includes('csgo') || egg.includes('cs2') || egg.includes('counter-strike') || egg.includes('counter strike')) return '/assets/backgrounds/csgo.jpg';
    if (egg.includes('gmod') || egg.includes('garry')) return '/assets/backgrounds/gmod.jpeg';
    if (egg.includes('fivem')) return '/assets/backgrounds/fivem.jpeg';
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

// Determines if the current value is in an alarm threshold so we can show it in red rather
// than the more faded default style.
const isAlarmState = (current: number, limit: number): boolean => limit > 0 && current / (limit * 1024 * 1024) >= 0.9;

const Icon = memo(
    styled(FontAwesomeIcon)<{ $alarm: boolean }>`
        ${(props) => (props.$alarm ? tw`text-red-400` : tw`text-neutral-500`)};
    `,
    isEqual
);

const IconDescription = styled.p<{ $alarm: boolean }>`
    ${tw`text-sm ml-2`};
    ${(props) => (props.$alarm ? tw`text-white` : tw`text-neutral-100`)};
`;

const StatusIndicatorBox = styled(GreyRowBox)<{ $status: ServerPowerState | undefined }>`
    ${tw`grid grid-cols-12 gap-4 relative`};

    & .status-bar {
        ${tw`w-2 bg-red-500 absolute right-0 z-20 rounded-full m-1 opacity-50 transition-all duration-150`};
        height: calc(100% - 0.5rem);

        ${({ $status }) =>
            !$status || $status === 'offline'
                ? tw`bg-red-500`
                : $status === 'running'
                ? tw`bg-green-500`
                : tw`bg-yellow-500`};
    }

    &:hover .status-bar {
        ${tw`opacity-75`};
    }
`;

type Timer = ReturnType<typeof setInterval>;

import { resolveColor } from '@/components/dashboard/groups/GroupColorDot';

export default ({ server, className, groupColor }: { server: Server; className?: string; groupColor?: string }) => {
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
        // Don't waste a HTTP request if there is nothing important to show to the user because
        // the server is suspended.
        if (isSuspended) return;

        getStats().then(() => {
            interval.current = setInterval(() => getStats(), 30000);
        });

        return () => {
            interval.current && clearInterval(interval.current);
        };
    }, [isSuspended]);

    const alarms = { cpu: false, memory: false, disk: false };
    if (stats) {
        alarms.cpu = server.limits.cpu === 0 ? false : stats.cpuUsagePercent >= server.limits.cpu * 0.9;
        alarms.memory = isAlarmState(stats.memoryUsageInBytes, server.limits.memory);
        alarms.disk = server.limits.disk === 0 ? false : isAlarmState(stats.diskUsageInBytes, server.limits.disk);
    }

    const diskLimit = server.limits.disk !== 0 ? bytesToString(mbToBytes(server.limits.disk)) : 'Unlimited';
    const memoryLimit = server.limits.memory !== 0 ? bytesToString(mbToBytes(server.limits.memory)) : 'Unlimited';
    const cpuLimit = server.limits.cpu !== 0 ? server.limits.cpu + ' %' : 'Unlimited';

    const backgroundImage = getServerBackground(server);

    const resolvedGroupColor = groupColor ? resolveColor(groupColor) : undefined;

    return (
        <StatusIndicatorBox
            as={Link}
            to={`/server/${server.id}`}
            className={className}
            $status={stats?.status}
            style={resolvedGroupColor ? { borderLeft: `3px solid ${resolvedGroupColor}55` } : undefined}
        >
            {/* Background image fading in from the right */}
            <div
                className={'absolute inset-0 bg-cover bg-center pointer-events-none'}
                style={{ backgroundImage: `url(${backgroundImage})` }}
            />
            <div
                className={'absolute inset-0 pointer-events-none'}
                style={{ background: 'linear-gradient(to right, #192024 30%, rgba(25,32,36,0.85) 55%, rgba(25,32,36,0.4) 80%, rgba(25,32,36,0.1) 100%)' }}
            />
            <div css={tw`flex items-center col-span-12 sm:col-span-5 lg:col-span-6 relative`}>
                <FontAwesomeIcon icon={faServer} css={tw`text-neutral-300 mr-4 text-lg flex-shrink-0`} />
                <div>
                    <p css={tw`text-lg break-words text-white font-semibold`}>{server.name}</p>
                    {!!server.description && (
                        <p css={tw`text-sm text-neutral-200 break-words line-clamp-2`}>{server.description}</p>
                    )}
                </div>
            </div>
            <div css={tw`flex-1 ml-4 lg:block lg:col-span-2 hidden relative`}>
                <div css={tw`flex justify-center`}>
                    <FontAwesomeIcon icon={faEthernet} css={tw`text-neutral-300`} />
                    <p css={tw`text-sm text-neutral-100 ml-2`}>
                        {server.allocations
                            .filter((alloc) => alloc.isDefault)
                            .map((allocation) => (
                                <React.Fragment key={allocation.ip + allocation.port.toString()}>
                                    {allocation.alias || ip(allocation.ip)}:{allocation.port}
                                </React.Fragment>
                            ))}
                    </p>
                </div>
            </div>
            <div css={tw`hidden col-span-7 lg:col-span-4 sm:flex items-baseline justify-center relative`}>
                {!stats || isSuspended ? (
                    isSuspended ? (
                        <div css={tw`flex-1 text-center`}>
                            <span css={tw`bg-red-500 rounded px-2 py-1 text-red-100 text-xs`}>
                                {server.status === 'suspended' ? 'Suspended' : 'Connection Error'}
                            </span>
                        </div>
                    ) : server.isTransferring || server.status ? (
                        <div css={tw`flex-1 text-center`}>
                            <span css={tw`bg-neutral-500 rounded px-2 py-1 text-neutral-100 text-xs`}>
                                {server.isTransferring
                                    ? 'Transferring'
                                    : server.status === 'installing'
                                    ? 'Installing'
                                    : server.status === 'restoring_backup'
                                    ? 'Restoring Backup'
                                    : 'Unavailable'}
                            </span>
                        </div>
                    ) : (
                        <Spinner size={'small'} />
                    )
                ) : (
                    <React.Fragment>
                        <div css={tw`flex-1 ml-4 sm:block hidden`}>
                            <div css={tw`flex justify-center`}>
                                <Icon icon={faMicrochip} $alarm={alarms.cpu} />
                                <IconDescription $alarm={alarms.cpu}>
                                    {stats.cpuUsagePercent.toFixed(2)} %
                                </IconDescription>
                            </div>
                            <p css={tw`text-xs text-neutral-300 text-center mt-1`}>of {cpuLimit}</p>
                        </div>
                        <div css={tw`flex-1 ml-4 sm:block hidden`}>
                            <div css={tw`flex justify-center`}>
                                <Icon icon={faMemory} $alarm={alarms.memory} />
                                <IconDescription $alarm={alarms.memory}>
                                    {bytesToString(stats.memoryUsageInBytes)}
                                </IconDescription>
                            </div>
                            <p css={tw`text-xs text-neutral-300 text-center mt-1`}>of {memoryLimit}</p>
                        </div>
                        <div css={tw`flex-1 ml-4 sm:block hidden`}>
                            <div css={tw`flex justify-center`}>
                                <Icon icon={faHdd} $alarm={alarms.disk} />
                                <IconDescription $alarm={alarms.disk}>
                                    {bytesToString(stats.diskUsageInBytes)}
                                </IconDescription>
                            </div>
                            <p css={tw`text-xs text-neutral-300 text-center mt-1`}>of {diskLimit}</p>
                        </div>
                    </React.Fragment>
                )}
            </div>
            <div className={'status-bar'} />
        </StatusIndicatorBox>
    );
};
