import React, { memo, useState } from 'react';
import { ServerContext } from '@/state/server';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import isEqual from 'react-fast-compare';
import Spinner from '@/components/elements/Spinner';
import Features from '@feature/Features';
import { Link, useRouteMatch } from 'react-router-dom';
import Console from '@/components/server/console/Console';
import OverviewStats from '@/components/server/console/OverviewStats';
import StatGraphs from '@/components/server/console/StatGraphs';
import ServerInfoCard from '@/components/server/console/ServerInfoCard';
import InstalledVersionCard from '@/components/server/console/InstalledVersionCard';
import QuickActionsCard from '@/components/server/console/QuickActionsCard';
import { Alert } from '@/components/elements/alert';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import { SocketEvent } from '@/components/server/events';
import RealmCard from '@/components/elements/realm/RealmCard';

const ServerConsoleContainer = () => {
    const { url } = useRouteMatch();
    const isInstalling = ServerContext.useStoreState((state) => state.server.isInstalling);
    const isTransferring = ServerContext.useStoreState((state) => state.server.data!.isTransferring);
    const eggFeatures = ServerContext.useStoreState((state) => state.server.data!.eggFeatures, isEqual);
    const isNodeUnderMaintenance = ServerContext.useStoreState((state) => state.server.data!.isNodeUnderMaintenance);
    const [errorCount, setErrorCount] = useState<number>(0);

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

            <div className={'grid grid-cols-1 lg:grid-cols-4 gap-4'}>
                <div className={'lg:col-span-1 flex flex-col gap-4 self-start'}>
                    <ServerInfoCard />
                    <InstalledVersionCard />
                    <QuickActionsCard />
                </div>

                <div className={'lg:col-span-3 flex flex-col gap-4'}>
                    <OverviewStats />

                    <RealmCard
                        rounded={'md'}
                        border={'soft'}
                        header={
                            <div className={'flex items-center justify-between gap-3'}>
                                <h2 className={'text-base font-semibold text-neutral-100 m-0'}>Console</h2>
                                {errorCount > 0 && (
                                    <span
                                        className={
                                            'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30'
                                        }
                                    >
                                        ⚠ {errorCount} {errorCount === 1 ? 'Error' : 'Errors'}
                                    </span>
                                )}
                            </div>
                        }
                        headerClassName={'!py-2.5 !bg-realm-card !border-realm-border/50'}
                        bodyClassName={'!p-0'}
                    >
                        <div className={'flex flex-col h-[24rem] lg:h-[26rem]'}>
                            <Spinner.Suspense>
                                <Console />
                            </Spinner.Suspense>
                        </div>
                    </RealmCard>

                    <div className={'grid grid-cols-1 md:grid-cols-2 gap-4'}>
                        <Spinner.Suspense>
                            <StatGraphs compact />
                        </Spinner.Suspense>
                    </div>

                    <RealmCard rounded={'md'} border={'soft'} bodyClassName={'text-left'}>
                        <p className={'text-sm text-neutral-400 m-0'}>
                            Want a closer look at CPU, memory, and network usage over time?{' '}
                            <Link to={`${url}/metrics`} className={'text-blue-600 hover:text-blue-500'}>
                                Click here
                            </Link>{' '}
                            for full statistics.
                        </p>
                    </RealmCard>
                </div>
            </div>

            <Features enabled={eggFeatures} />
        </ServerContentBlock>
    );
};

export default memo(ServerConsoleContainer, isEqual);
