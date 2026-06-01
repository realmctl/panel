import React, { memo, useState } from 'react';
import { ServerContext } from '@/state/server';
import Can from '@/components/elements/Can';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import isEqual from 'react-fast-compare';
import Spinner from '@/components/elements/Spinner';
import Features from '@feature/Features';
import Console from '@/components/server/console/Console';
import PowerButtons from '@/components/server/console/PowerButtons';
import { Alert } from '@/components/elements/alert';
import { ip } from '@/lib/formatters';
import { capitalize } from '@/lib/strings';
import UptimeDuration from '@/components/server/UptimeDuration';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import { SocketEvent } from '@/components/server/events';

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

const ServerCardPowerButtons = () => {
    const status = ServerContext.useStoreState((state) => state.status.value);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);

    const sendAction = (action: string) => {
        if (instance) {
            instance.send('set state', action);
        }
    };

    return (
        <div className={'mt-6 flex gap-2'}>
            {(status === 'offline' || status === null) && (
                <button
                    onClick={() => sendAction('start')}
                    className={'px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md border-0 cursor-pointer transition-colors duration-150'}
                >
                    Start
                </button>
            )}
            {(status === 'running' || status === 'starting') && (
                <button
                    onClick={() => sendAction('stop')}
                    className={'px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md border-0 cursor-pointer transition-colors duration-150'}
                >
                    Shut down
                </button>
            )}
            {(status === 'running' || status === 'starting' || status === 'stopping') && (
                <button
                    onClick={() => sendAction('kill')}
                    className={'px-4 py-2 text-sm font-medium text-neutral-200 bg-neutral-700/60 hover:bg-neutral-700 rounded-md border border-[#2d3338] cursor-pointer transition-colors duration-150'}
                >
                    Kill Server
                </button>
            )}
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

            <div className={'grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4'}>
                {/* Left: Server info + Runtime cards */}
                <div className={'lg:col-span-1 flex flex-col gap-4'}>
                    {/* Server card */}
                    <div
                        className={'rounded-md border border-[#2d3338]/50 p-5'}
                        style={{ backgroundColor: '#192024' }}
                    >
                        <h2 className={'text-lg font-semibold text-neutral-100 m-0 mb-4'}>Server</h2>
                        <div className={'border-t border-[#2d3338]/50 mb-4'}></div>

                        <div className={'space-y-4'}>
                            <div className={'flex items-center'}>
                                <span className={'text-sm text-neutral-400 w-20'}>Status</span>
                                <StatusIndicator status={status} />
                            </div>
                            <div className={'flex items-center'}>
                                <span className={'text-sm text-neutral-400 w-20'}>IP</span>
                                <span className={'text-sm text-neutral-200 font-mono'}>{allocation}</span>
                            </div>
                        </div>

                        <Can action={['control.start', 'control.stop', 'control.restart']} matchAny>
                            <ServerCardPowerButtons />
                        </Can>
                    </div>

                    {/* Runtime card */}
                    <div
                        className={'rounded-md border border-[#2d3338]/50 p-5'}
                        style={{ backgroundColor: '#192024' }}
                    >
                        <h2 className={'text-lg font-semibold text-neutral-100 m-0 mb-4'}>Runtime</h2>
                        <div className={'border-t border-[#2d3338]/50 mb-4'}></div>

                        <div className={'space-y-3'}>
                            <div className={'flex items-center justify-between'}>
                                <span className={'text-sm text-neutral-400'}>Type</span>
                                <span className={'text-sm text-neutral-200'}>{eggName || 'Unknown'}</span>
                            </div>
                            <div className={'flex items-center justify-between'}>
                                <span className={'text-sm text-neutral-400'}>Node</span>
                                <span className={'text-sm text-neutral-200'}>{nodeName}</span>
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
                        </div>
                    </div>
                </div>

                {/* Middle: Console */}
                <div className={'lg:col-span-2'}>
                    <div
                        className={'rounded-md border border-[#2d3338]/50 overflow-hidden h-full flex flex-col'}
                        style={{ backgroundColor: '#192024' }}
                    >
                        <div className={'px-5 py-3 flex items-center justify-between'}>
                            <h2 className={'text-lg font-semibold text-neutral-100 m-0'}>Console</h2>
                            {errorCount > 0 && (
                                <span className={'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30'}>
                                    ⚠ {errorCount} {errorCount === 1 ? 'Error' : 'Errors'}
                                </span>
                            )}
                        </div>
                        <div className={'flex-1'}>
                            <Spinner.Suspense>
                                <Console />
                            </Spinner.Suspense>
                        </div>
                    </div>
                </div>
            </div>

            <Features enabled={eggFeatures} />
        </ServerContentBlock>
    );
};

export default memo(ServerConsoleContainer, isEqual);
