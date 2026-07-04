import React, { useEffect, useState } from 'react';
import { Link, useRouteMatch } from 'react-router-dom';
import classNames from 'classnames';
import { PencilIcon, GlobeAltIcon, DuplicateIcon } from '@heroicons/react/outline';
import { ServerContext } from '@/state/server';
import CopyOnClick from '@/components/elements/CopyOnClick';
import RealmCard from '@/components/elements/realm/RealmCard';
import { getServerBackground } from '@/lib/serverBackground';
import { getServerConnectionAddress, resolveServerDisplayStatus } from '@/components/server/players/serverHeaderMeta';
import { isMinecraftEgg, serverSupportsPlayers } from '@/lib/minecraftEgg';
import getServerPlayers from '@/api/server/players/getServerPlayers';
import useGetSubdomains, { subdomainDomainName } from '@/api/server/network/subdomains/getSubdomains';

// Temporary: pull a game icon from a public CDN until we have our own icon set.
const getServerIconUrl = (eggName: string): string | null => {
    if (isMinecraftEgg(eggName)) {
        return 'https://mc-heads.net/avatar/MHF_Grass/64';
    }

    return null;
};

const STATUS_DOT: Record<string, string> = {
    running: 'bg-green-400',
    starting: 'bg-yellow-400',
    stopping: 'bg-yellow-400',
    offline: 'bg-red-400',
    neutral: 'bg-neutral-400',
};

const InfoRow = ({
    label,
    value,
    action,
}: {
    label: string;
    value: React.ReactNode;
    action?: React.ReactNode;
}) => (
    <div className={'flex items-center justify-between gap-3 py-2.5 border-t border-realm-border/50 first:border-t-0 first:pt-0'}>
        <span className={'text-xs text-neutral-500 flex-shrink-0'}>{label}</span>
        <div className={'flex items-center gap-2 min-w-0'}>
            <span className={'text-sm text-neutral-200 truncate'}>{value}</span>
            {action}
        </div>
    </div>
);

export default ({ className }: { className?: string }) => {
    const { url } = useRouteMatch();
    const server = ServerContext.useStoreState((state) => state.server.data!);
    const powerStatus = ServerContext.useStoreState((state) => state.status.value);
    const [players, setPlayers] = useState<{ online: number; max: number } | null>(null);

    const { data: subdomains } = useGetSubdomains();

    const showPlayers = serverSupportsPlayers(server.eggName, server.eggCategory);
    const display = resolveServerDisplayStatus(powerStatus, server);
    const address = getServerConnectionAddress(server);
    const backgroundImage = getServerBackground(server);
    const iconUrl = getServerIconUrl(server.eggName) ?? backgroundImage;

    const activeSubdomain = subdomains?.domains.data[0];
    const domain = activeSubdomain ? `${activeSubdomain.name}.${subdomainDomainName(activeSubdomain)}` : null;

    useEffect(() => {
        if (!showPlayers || powerStatus !== 'running') {
            setPlayers(null);
            return;
        }

        const fetchPlayers = () =>
            getServerPlayers(server.uuid)
                .then((data) => setPlayers({ online: data.players.online, max: data.players.max }))
                .catch(() => setPlayers(null));

        fetchPlayers();
        const interval = setInterval(fetchPlayers, 30000);

        return () => clearInterval(interval);
    }, [showPlayers, powerStatus, server.uuid]);

    const playersValue = !showPlayers
        ? 'N/A'
        : players
        ? `${players.online}/${players.max} players online`
        : display.tone === 'running'
        ? 'Loading…'
        : 'Offline';

    return (
        <RealmCard
            rounded={'md'}
            border={'soft'}
            header={<h2 className={'text-base font-semibold text-neutral-100 m-0'}>Server</h2>}
            headerClassName={'!py-2.5 !bg-realm-card !border-realm-border/50'}
            className={className}
        >
            <div className={'relative rounded-md border border-realm-border/50 overflow-hidden mb-1'}>
                <div className={'absolute inset-0 pointer-events-none'}>
                    <div
                        className={'absolute inset-0 bg-cover bg-center'}
                        style={{ backgroundImage: `url(${backgroundImage})` }}
                    />
                    <div
                        className={'absolute inset-0'}
                        style={{
                            background:
                                'linear-gradient(to right, #192024 0%, rgba(25,32,36,0.95) 40%, rgba(25,32,36,0.8) 60%, rgba(25,32,36,0.5) 80%, rgba(25,32,36,0.25) 100%)',
                        }}
                    />
                </div>

                <div className={'relative flex items-center gap-3 px-3 py-3'}>
                    <img
                        src={iconUrl}
                        alt={server.eggName}
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = backgroundImage;
                        }}
                        className={'w-12 h-12 rounded-md object-cover flex-shrink-0 border border-realm-border/50 bg-realm-card'}
                    />
                    <div className={'min-w-0 flex-1'}>
                        <p className={'text-sm font-semibold text-neutral-100 truncate m-0'}>
                            {server.eggName || 'Game Server'}
                        </p>
                        <span className={'inline-flex items-center gap-1.5 mt-1 text-xs font-medium text-neutral-400'}>
                            <span className={classNames('w-1.5 h-1.5 rounded-full flex-shrink-0', STATUS_DOT[display.tone])} />
                            {display.label.toUpperCase()}
                        </span>
                    </div>
                    {address && (
                        <CopyOnClick text={address}>
                            <button
                                type={'button'}
                                title={`Copy ${address} to clipboard`}
                                className={
                                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 border-0 cursor-pointer transition-colors duration-150 flex-shrink-0'
                                }
                            >
                                Join
                            </button>
                        </CopyOnClick>
                    )}
                </div>
            </div>

            <div className={'mt-3'}>
                <InfoRow
                    label={'Server Name'}
                    value={server.name}
                    action={
                        <Link to={`${url}/settings`} title={'Edit server name'}>
                            <PencilIcon className={'w-3.5 h-3.5 text-neutral-500 hover:text-neutral-300 transition-colors duration-150'} />
                        </Link>
                    }
                />
                <InfoRow
                    label={'Players'}
                    value={playersValue}
                    action={
                        <Link to={`${url}/users`} title={'Manage access'}>
                            <PencilIcon className={'w-3.5 h-3.5 text-neutral-500 hover:text-neutral-300 transition-colors duration-150'} />
                        </Link>
                    }
                />
                <InfoRow
                    label={'IP Address'}
                    value={address ?? 'N/A'}
                    action={
                        address && (
                            <div className={'flex items-center gap-2 flex-shrink-0'}>
                                <CopyOnClick text={address}>
                                    <button
                                        type={'button'}
                                        title={'Copy address'}
                                        className={'bg-transparent border-0 p-0 cursor-pointer'}
                                    >
                                        <DuplicateIcon className={'w-3.5 h-3.5 text-neutral-500 hover:text-neutral-300 transition-colors duration-150'} />
                                    </button>
                                </CopyOnClick>
                                <Link to={`${url}/network`} title={'Manage networking'}>
                                    <GlobeAltIcon className={'w-3.5 h-3.5 text-neutral-500 hover:text-neutral-300 transition-colors duration-150'} />
                                </Link>
                            </div>
                        )
                    }
                />
                <InfoRow
                    label={'Domain'}
                    value={domain ?? 'No domain attached'}
                    action={
                        domain && (
                            <div className={'flex items-center gap-2 flex-shrink-0'}>
                                <CopyOnClick text={domain}>
                                    <button
                                        type={'button'}
                                        title={'Copy domain'}
                                        className={'bg-transparent border-0 p-0 cursor-pointer'}
                                    >
                                        <DuplicateIcon className={'w-3.5 h-3.5 text-neutral-500 hover:text-neutral-300 transition-colors duration-150'} />
                                    </button>
                                </CopyOnClick>
                                <Link to={`${url}/network/subdomains`} title={'Manage domains'}>
                                    <GlobeAltIcon className={'w-3.5 h-3.5 text-neutral-500 hover:text-neutral-300 transition-colors duration-150'} />
                                </Link>
                            </div>
                        )
                    }
                />
            </div>
        </RealmCard>
    );
};
