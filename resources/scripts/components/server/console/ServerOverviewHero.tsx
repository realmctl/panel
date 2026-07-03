import React from 'react';
import classNames from 'classnames';
import { ServerContext } from '@/state/server';
import ServerPowerControls from '@/components/server/console/ServerPowerControls';
import CopyOnClick from '@/components/elements/CopyOnClick';
import { ip } from '@/lib/formatters';
import { capitalize } from '@/lib/strings';
import { getServerBackground } from '@/lib/serverBackground';

const statusDotColor = (status: string | null): string =>
    status === 'running' ? 'bg-green-400' : status === 'offline' || status === null ? 'bg-red-400' : 'bg-yellow-400';

const ServerOverviewHero = ({ className }: { className?: string }) => {
    const name = ServerContext.useStoreState((state) => state.server.data!.name);
    const eggName = ServerContext.useStoreState((state) => state.server.data!.eggName);
    const eggBackground = ServerContext.useStoreState((state) => state.server.data!.eggBackground);
    const dockerImage = ServerContext.useStoreState((state) => state.server.data!.dockerImage);
    const status = ServerContext.useStoreState((state) => state.status.value);

    const allocation = ServerContext.useStoreState((state) => {
        const match = state.server.data!.allocations.find((a) => a.isDefault);
        return match ? `${match.alias || ip(match.ip)}:${match.port}` : 'n/a';
    });

    const backgroundImage = getServerBackground({ eggBackground, eggName, dockerImage });

    return (
        <div
            className={classNames(
                'relative rounded-md border border-realm-border/50 bg-realm-card',
                className
            )}
        >
            <div className={'absolute inset-0 rounded-md overflow-hidden'}>
                <div
                    className={'absolute inset-0 bg-cover bg-center'}
                    style={{ backgroundImage: `url(${backgroundImage})` }}
                />
                <div
                    className={'absolute inset-0 pointer-events-none'}
                    style={{
                        background:
                            'linear-gradient(to bottom, rgba(25, 32, 36, 0.25) 0%, rgba(25, 32, 36, 0.55) 40%, rgba(25, 32, 36, 0.92) 80%, rgba(25, 32, 36, 1) 100%)',
                    }}
                />
            </div>

            <div className={'relative flex flex-wrap items-end justify-between gap-4 px-6 pt-16 pb-5'}>
                <div className={'min-w-0'}>
                    <h1 className={'text-xl font-semibold text-white m-0 truncate'}>{name}</h1>
                    <div className={'flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-sm'}>
                        <span className={'flex items-center gap-1.5 text-neutral-200'}>
                            <span className={classNames('w-2 h-2 rounded-full flex-shrink-0', statusDotColor(status))} />
                            {status ? capitalize(status) : 'Offline'}
                        </span>
                        <span className={'text-neutral-600'}>•</span>
                        <CopyOnClick text={allocation}>
                            <span className={'font-mono text-neutral-300 hover:text-neutral-100 transition-colors duration-150'}>
                                {allocation}
                            </span>
                        </CopyOnClick>
                        <span className={'text-neutral-600'}>•</span>
                        <span className={'text-neutral-400'}>{eggName || 'Game Server'}</span>
                    </div>
                </div>
                <div className={'flex-shrink-0'}>
                    <ServerPowerControls />
                </div>
            </div>
        </div>
    );
};

export default ServerOverviewHero;
