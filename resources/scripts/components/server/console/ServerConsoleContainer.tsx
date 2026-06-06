import React, { memo, useState } from 'react';
import { ServerContext } from '@/state/server';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import isEqual from 'react-fast-compare';
import Spinner from '@/components/elements/Spinner';
import Features from '@feature/Features';
import Console from '@/components/server/console/Console';
import ServerPowerControls from '@/components/server/console/ServerPowerControls';
import { Alert } from '@/components/elements/alert';
import { ip } from '@/lib/formatters';
import { capitalize } from '@/lib/strings';
import UptimeDuration from '@/components/server/UptimeDuration';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import { SocketEvent } from '@/components/server/events';
import RealmCard from '@/components/elements/realm/RealmCard';
import { countryFlagUrl, formatGeoLocationLabel } from '@/lib/countryFlag';

const StatusIndicator = ({ status }: { status: string | null }) => {
    const color = status === 'running'
        ? 'bg-green-500'
        : status === 'offline' || status === null
        ? 'bg-red-500'
        : 'bg-yellow-500';

    const label = status ? capitalize(status) : 'Offline';

    return (
        <div className={'flex items-center gap-2'}>
            <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
            <span className={'text-sm text-neutral-200'}>{label}</span>
        </div>
    );
};

const ServerConsoleContainer = () => {
    const name = ServerContext.useStoreState((state) => state.server.data!.name);
    const isInstalling = ServerContext.useStoreState((state) => state.server.isInstalling);
    const isTransferring = ServerContext.useStoreState((state) => state.server.data!.isTransferring);
    const eggFeatures = ServerContext.useStoreState((state) => state.server.data!.eggFeatures, isEqual);
    const isNodeUnderMaintenance = ServerContext.useStoreState((state) => state.server.data!.isNodeUnderMaintenance);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const nodeName = ServerContext.useStoreState((state) => state.server.data!.node);
    const nodeLocation = ServerContext.useStoreState((state) => state.server.data!.nodeLocation);
    const nodeFlagUrl = countryFlagUrl(nodeLocation?.countryCode);
    const nodeLocationLabel = formatGeoLocationLabel(nodeLocation);
    const eggName = ServerContext.useStoreState((state) => state.server.data!.eggName);
    const [uptime, setUptime] = useState<number>(0);
    const [errorCount, setErrorCount] = useState<number>(0);

    const allocation = ServerContext.useStoreState((state) => {
        const match = state.server.data!.allocations.find((a) => a.isDefault);
        return match ? `${match.alias || ip(match.ip)}:${match.port}` : 'n/a';
    });

    useWebsocketEvent(SocketEvent.STATS, (data) => {
        try {
            const stats = JSON.parse(data);
            setUptime(stats.uptime || 0);
        } catch (e) {
            // ignore
        }
    });

    useWebsocketEvent(SocketEvent.DAEMON_ERROR, () => {
        setErrorCount((prev) => prev + 1);
    });

    return (
        <ServerContentBlock title={'Overview'}>
            {(isNodeUnderMaintenance || isInstalling || isTransferring) && (
                <Alert type={'warning'} className={'mb-4'}>
                    {isNodeUnderMaintenance
                        ? 'The node of this server is currently under maintenance and all actions are unavailable.'
                        : isInstalling
                        ? 'This server is currently running its installation process and most actions are unavailable.'
                        : 'This server is currently being transferred to another node and all actions are unavailable.'}
                </Alert>
            )}

            <div className={'grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 lg:items-stretch'}>
                {/* Left: Server info + Runtime cards */}
                <div className={'lg:col-span-1 flex flex-col gap-4'}>
                    <RealmCard
                        rounded={'md'}
                        border={'soft'}
                        header={<h2 className={'text-base font-semibold text-neutral-100 m-0'}>Server</h2>}
                        headerClassName={'!py-2.5'}
                        bodyClassName={'!p-4 space-y-3'}
                    >
                        <div className={'flex items-center justify-between'}>
                            <span className={'text-sm text-neutral-400'}>Status</span>
                            <StatusIndicator status={status} />
                        </div>
                        <div className={'flex items-center justify-between'}>
                            <span className={'text-sm text-neutral-400'}>IP</span>
                            <span className={'text-sm text-neutral-200 font-mono'}>{allocation}</span>
                        </div>
                        <div className={'pt-3 border-t border-realm-border/50'}>
                            <ServerPowerControls variant={'card'} />
                        </div>
                    </RealmCard>

                    <RealmCard
                        rounded={'md'}
                        border={'soft'}
                        header={<h2 className={'text-base font-semibold text-neutral-100 m-0'}>Runtime</h2>}
                        headerClassName={'!py-2.5'}
                        bodyClassName={'!p-4 space-y-3'}
                    >
                        <div className={'flex items-center justify-between'}>
                            <span className={'text-sm text-neutral-400'}>Type</span>
                            <span className={'text-sm text-neutral-200'}>{eggName || 'Unknown'}</span>
                        </div>
                        <div className={'flex items-center justify-between'}>
                            <span className={'text-sm text-neutral-400'}>Node</span>
                            <span className={'flex items-center gap-1.5 text-sm text-neutral-200'}>
                                {nodeFlagUrl && (
                                    <img
                                        src={nodeFlagUrl}
                                        alt={nodeLocationLabel || nodeLocation?.country || ''}
                                        title={nodeLocationLabel || undefined}
                                        width={20}
                                        height={15}
                                        className={'w-5 h-auto rounded-sm object-cover flex-shrink-0'}
                                        loading={'lazy'}
                                        decoding={'async'}
                                    />
                                )}
                                <span>{nodeName}</span>
                            </span>
                        </div>
                        <div className={'flex items-center justify-between'}>
                            <span className={'text-sm text-neutral-400'}>Uptime</span>
                            <span className={'text-sm text-neutral-200'}>
                                {status === 'running' && uptime > 0 ? (
                                    <UptimeDuration uptime={uptime / 1000} />
                                ) : (
                                    '--'
                                )}
                            </span>
                        </div>
                    </RealmCard>
                </div>

                <div className={'lg:col-span-2 flex min-h-[28rem] lg:min-h-[32rem]'}>
                    <RealmCard
                        rounded={'md'}
                        border={'soft'}
                        className={'flex flex-col flex-1 min-h-0'}
                        header={
                            <div className={'flex items-center justify-between gap-3'}>
                                <h2 className={'text-base font-semibold text-neutral-100 m-0'}>Console</h2>
                                {errorCount > 0 && (
                                    <span className={'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30'}>
                                        ⚠ {errorCount} {errorCount === 1 ? 'Error' : 'Errors'}
                                    </span>
                                )}
                            </div>
                        }
                        headerClassName={'!py-2.5'}
                        bodyClassName={'!p-0 flex-1 flex flex-col min-h-0'}
                    >
                        <div className={'flex-1 min-h-0'}>
                            <Spinner.Suspense>
                                <Console />
                            </Spinner.Suspense>
                        </div>
                    </RealmCard>
                </div>
            </div>

            <Features enabled={eggFeatures} />
        </ServerContentBlock>
    );
};

export default memo(ServerConsoleContainer, isEqual);
