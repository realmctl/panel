import React, { memo, useMemo } from 'react';
import { ServerContext } from '@/state/server';
import Can from '@/components/elements/Can';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import isEqual from 'react-fast-compare';
import Spinner from '@/components/elements/Spinner';
import Features from '@feature/Features';
import Console from '@/components/server/console/Console';
import StatGraphs from '@/components/server/console/StatGraphs';
import PowerButtons from '@/components/server/console/PowerButtons';
import { Alert } from '@/components/elements/alert';
import { ip } from '@/lib/formatters';
import { capitalize } from '@/lib/strings';

export type PowerAction = 'start' | 'stop' | 'restart' | 'kill';

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

    const allocation = ServerContext.useStoreState((state) => {
        const match = state.server.data!.allocations.find((a) => a.isDefault);
        return match ? `${match.alias || ip(match.ip)}:${match.port}` : 'n/a';
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

            <div className={'grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4'}>
                {/* Left: Server info card */}
                <div
                    className={'lg:col-span-1 rounded-md border border-[#2d3338]/50 p-5 flex flex-col justify-between'}
                    style={{ backgroundColor: '#192024' }}
                >
                    <div>
                        <h2 className={'text-lg font-semibold text-neutral-100 m-0 mb-4'}>Server</h2>

                        <div className={'space-y-3'}>
                            <div className={'flex items-center justify-between'}>
                                <span className={'text-sm text-neutral-400'}>Status</span>
                                <StatusIndicator status={status} />
                            </div>
                            <div className={'flex items-center justify-between'}>
                                <span className={'text-sm text-neutral-400'}>IP</span>
                                <span className={'text-sm text-neutral-200 font-mono'}>{allocation}</span>
                            </div>
                        </div>
                    </div>

                    <div className={'mt-6'}>
                        <Can action={['control.start', 'control.stop', 'control.restart']} matchAny>
                            <PowerButtons className={'flex gap-2'} />
                        </Can>
                    </div>
                </div>

                {/* Right: Console */}
                <div className={'lg:col-span-2'}>
                    <Spinner.Suspense>
                        <Console />
                    </Spinner.Suspense>
                </div>
            </div>

            <div className={'grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4'}>
                <Spinner.Suspense>
                    <StatGraphs />
                </Spinner.Suspense>
            </div>
            <Features enabled={eggFeatures} />
        </ServerContentBlock>
    );
};

export default memo(ServerConsoleContainer, isEqual);
