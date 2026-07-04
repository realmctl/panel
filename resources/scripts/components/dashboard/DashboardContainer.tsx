import React, { useEffect, useState } from 'react';
import { ServerIcon, UserGroupIcon } from '@heroicons/react/outline';
import { Server } from '@/api/server/getServer';
import getServers, { getAllServers } from '@/api/getServers';
import ServerCard from '@/components/dashboard/ServerCard';
import ServerTable from '@/components/dashboard/ServerTable';
import GroupSection from '@/components/dashboard/groups/GroupSection';
import CreateGroupModal from '@/components/dashboard/groups/CreateGroupModal';
import { ServerGroup } from '@/api/account/serverGroups';
import Spinner from '@/components/elements/Spinner';
import PageContentBlock from '@/components/elements/PageContentBlock';
import useFlash from '@/plugins/useFlash';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { usePersistedState } from '@/plugins/usePersistedState';
import tw from 'twin.macro';
import useSWR from 'swr';
import { PaginatedResult } from '@/api/http';
import Pagination from '@/components/elements/Pagination';
import { useLocation } from 'react-router-dom';

export default () => {
    const { search } = useLocation();
    const defaultPage = Number(new URLSearchParams(search).get('page') || '1');

    const [page, setPage] = useState(!isNaN(defaultPage) && defaultPage > 0 ? defaultPage : 1);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const uuid = useStoreState((state: ApplicationStore) => state.user.data!.uuid);
    const rootAdmin = useStoreState((state: ApplicationStore) => state.user.data!.rootAdmin);
    const groups = useStoreState((state: ApplicationStore) => state.serverGroups.data);

    const [filterRaw, setFilter] = usePersistedState<'all' | 'owner' | 'shared' | 'admin'>(
        `${uuid}:server_filter`,
        'all'
    );
    const filter = filterRaw === 'admin' && !rootAdmin ? 'all' : filterRaw ?? 'all';
    const [layoutRaw, setLayout] = usePersistedState<'grid' | 'list'>(`${uuid}:server_layout`, 'grid');
    const layout: 'grid' | 'list' = layoutRaw ?? 'grid';
    const [collapsed, setCollapsed] = usePersistedState<Record<string, boolean>>(`${uuid}:group_collapsed`, {});
    const [modal, setModal] = useState<'create' | ServerGroup | null>(null);

    const serverType = filter === 'all' ? undefined : filter;
    const hasGroups = groups.length > 0;
    const needsAllServers = hasGroups || modal !== null;

    const { data: servers, error } = useSWR<PaginatedResult<Server>>(
        ['/api/client/servers', filter, page],
        () => getServers({ page, type: serverType })
    );

    const { data: allServersList, error: allServersError } = useSWR<Server[]>(
        needsAllServers ? ['/api/client/servers/all', filter] : null,
        () => getAllServers({ type: serverType }),
        { revalidateOnFocus: false, dedupingInterval: 60_000 }
    );

    useEffect(() => {
        setPage(1);
    }, [filter]);

    useEffect(() => {
        if (!servers) return;
        if (servers.pagination.currentPage > 1 && !servers.items.length) {
            setPage(1);
        }
    }, [servers?.pagination.currentPage]);

    useEffect(() => {
        window.history.replaceState(null, document.title, `/${page <= 1 ? '' : `?page=${page}`}`);
    }, [page]);

    useEffect(() => {
        const activeError = hasGroups ? allServersError : error;

        if (activeError) clearAndAddHttpError({ key: 'dashboard', error: activeError });
        if (!activeError) clearFlashes('dashboard');
    }, [error, allServersError, hasGroups]);

    const toggleCollapse = (groupUuid: string) => {
        setCollapsed((prev) => ({ ...(prev ?? {}), [groupUuid]: !(prev ?? {})[groupUuid] }));
    };

    const allServers = hasGroups ? (allServersList ?? servers?.items ?? []) : (servers?.items ?? []);
    const modalServers = needsAllServers ? (allServersList ?? servers?.items ?? []) : (servers?.items ?? []);
    const isLoading = !servers;
    const isLoadingAllServers = hasGroups && !allServersList;

    // Partition servers into groups + ungrouped.
    const groupedServers = groups.map((group) => ({
        group,
        servers: allServers.filter((s) => group.serverUuids.includes(s.uuid)),
    }));

    const groupedUuids = new Set(groups.flatMap((g) => g.serverUuids));
    const ungrouped = allServers.filter((s) => !groupedUuids.has(s.uuid));

    const renderServers = (items: Server[], color?: string) =>
        layout === 'grid' ? (
            <div className={'grid grid-cols-1 md:grid-cols-2 gap-4'}>
                {items.map((s) => <ServerCard key={s.uuid} server={s} groupColor={color} />)}
            </div>
        ) : (
            <ServerTable servers={items} groupColor={color} />
        );

    return (
        <PageContentBlock title={'Dashboard'} showFlashKey={'dashboard'}>
            {modal && (
                <CreateGroupModal
                    servers={modalServers}
                    editing={modal === 'create' ? undefined : modal}
                    onClose={() => setModal(null)}
                />
            )}

            <div className={'mb-6'}>
                <h1 className={'text-2xl font-header font-semibold text-neutral-100 m-0'}>My Servers</h1>
                <p className={'text-sm text-neutral-400 mt-1 m-0'}>
                    Your servers and servers that your friends have shared with you.
                </p>
            </div>

            {/* View filter + layout toggle */}
            <div className={'mb-4 flex justify-between items-center gap-3'}>
                <div className={'flex items-center gap-1 p-1 rounded-md border border-realm-border/50 bg-realm-card'}>
                    {(
                        [
                            { key: 'all', label: 'View All' },
                            { key: 'owner', label: 'Owned By Me' },
                            { key: 'shared', label: 'Shared With Me' },
                        ] as { key: 'all' | 'owner' | 'shared' | 'admin'; label: string }[]
                    ).map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors duration-150 border-0 cursor-pointer ${
                                filter === tab.key
                                    ? 'bg-blue-500/15 text-blue-400'
                                    : 'text-neutral-400 hover:text-neutral-200 bg-transparent'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className={'flex items-center gap-3'}>
                    {groups.length > 0 && (
                        <div className={'flex items-center gap-1.5 flex-wrap'}>
                            {groups.map((g) => (
                                <button
                                    key={g.uuid}
                                    onClick={() => setModal(g)}
                                    className={'flex items-center gap-1.5 px-2 py-1 rounded text-xs text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer border border-transparent hover:border-realm-border bg-transparent'}
                                >
                                    <span
                                        className={'w-2 h-2 rounded-full inline-block flex-shrink-0'}
                                        style={{ backgroundColor: g.color.startsWith('#') ? g.color : `var(--color-${g.color}, #3b82f6)` }}
                                    />
                                    {g.name}
                                </button>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={() => setModal('create')}
                        title={'New Group'}
                        className={
                            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-realm-border/50 text-neutral-400 hover:text-neutral-200 hover:border-[#3d4348] transition-colors cursor-pointer bg-realm-card'
                        }
                    >
                        <svg xmlns={'http://www.w3.org/2000/svg'} className={'w-3.5 h-3.5'} viewBox={'0 0 24 24'} fill={'currentColor'}>
                            <path d={'M12 5v14M5 12h14'} stroke={'currentColor'} strokeWidth={2} strokeLinecap={'round'} fill={'none'} />
                        </svg>
                        New Group
                    </button>

                    <div
                        className={'flex items-center rounded-md border border-realm-border/50 bg-realm-card overflow-hidden'}
                    >
                        <button
                            onClick={() => setLayout('grid')}
                            title={'Card view'}
                            className={`p-1.5 transition-colors duration-150 border-0 cursor-pointer ${layout === 'grid' ? 'text-neutral-100 bg-white/10' : 'text-neutral-500 hover:text-neutral-300 bg-transparent'}`}
                        >
                            <svg xmlns={'http://www.w3.org/2000/svg'} className={'w-4 h-4'} viewBox={'0 0 24 24'} fill={'currentColor'}>
                                <path d={'M3 3h8v8H3V3zm0 10h8v8H3v-8zm10-10h8v8h-8V3zm0 10h8v8h-8v-8z'} />
                            </svg>
                        </button>
                        <button
                            onClick={() => setLayout('list')}
                            title={'List view'}
                            className={`p-1.5 transition-colors duration-150 border-0 cursor-pointer ${layout === 'list' ? 'text-neutral-100 bg-white/10' : 'text-neutral-500 hover:text-neutral-300 bg-transparent'}`}
                        >
                            <svg xmlns={'http://www.w3.org/2000/svg'} className={'w-4 h-4'} viewBox={'0 0 24 24'} fill={'currentColor'}>
                                <path d={'M3 5h18v2H3V5zm0 6h18v2H3v-2zm0 6h18v2H3v-2z'} />
                            </svg>
                        </button>
                    </div>

                    {rootAdmin && (
                        <button
                            onClick={() => setFilter(filter === 'admin' ? 'all' : 'admin')}
                            title={"Others' servers"}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors duration-150 cursor-pointer ${
                                filter === 'admin'
                                    ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                                    : 'border-realm-border/50 bg-realm-card text-neutral-400 hover:text-neutral-200 hover:border-[#3d4348]'
                            }`}
                        >
                            <svg xmlns={'http://www.w3.org/2000/svg'} className={'w-3.5 h-3.5'} viewBox={'0 0 24 24'} fill={'currentColor'}>
                                <path d={'M12 2a5 5 0 100 10 5 5 0 000-10zM4 20a8 8 0 1116 0H4z'} />
                            </svg>
                            Admin
                        </button>
                    )}
                </div>
            </div>

            {isLoading ? (
                <Spinner centered size={'large'} />
            ) : allServers.length === 0 ? (
                <div
                    className={
                        'flex flex-col items-center justify-center gap-3 py-16 px-6 rounded-md border border-dashed border-realm-border text-center'
                    }
                >
                    <div className={'flex items-center justify-center w-12 h-12 rounded-full bg-realm-card border border-realm-border/50'}>
                        {filter === 'shared' ? (
                            <UserGroupIcon className={'w-5 h-5 text-neutral-500'} />
                        ) : (
                            <ServerIcon className={'w-5 h-5 text-neutral-500'} />
                        )}
                    </div>
                    <div>
                        <p className={'text-sm font-medium text-neutral-200 m-0'}>
                            {filter === 'admin'
                                ? 'No other servers'
                                : filter === 'owner'
                                ? 'No servers yet'
                                : filter === 'shared'
                                ? 'Nothing shared with you'
                                : 'No servers found'}
                        </p>
                        <p className={'text-sm text-neutral-500 mt-1 m-0 max-w-sm'}>
                            {filter === 'admin'
                                ? 'Every server on this panel is already visible to you elsewhere.'
                                : filter === 'owner'
                                ? "Servers you own will show up here once you've created one."
                                : filter === 'shared'
                                ? 'When someone adds you as a subuser on their server, it will appear here.'
                                : 'There are no servers associated with your account.'}
                        </p>
                    </div>
                </div>
            ) : hasGroups ? (
                <>
                    {isLoadingAllServers && (
                        <p css={tw`text-center text-xs text-neutral-500 mb-4`}>
                            Loading all servers for groups…
                        </p>
                    )}
                    {groupedServers
                        .filter(({ servers }) => servers.length > 0)
                        .map(({ group, servers }) => (
                            <GroupSection
                                key={group.uuid}
                                name={group.name}
                                color={group.color}
                                servers={servers}
                                layout={layout}
                                collapsed={!!(collapsed ?? {})[group.uuid]}
                                onToggle={() => toggleCollapse(group.uuid)}
                            />
                        ))}

                    {ungrouped.length > 0 && (
                        <GroupSection
                            name={'Other'}
                            color={'#4b5563'}
                            servers={ungrouped}
                            layout={layout}
                            collapsed={!!(collapsed ?? {})['__ungrouped__']}
                            onToggle={() => toggleCollapse('__ungrouped__')}
                        />
                    )}
                </>
            ) : servers ? (
                /* No groups — use pagination as before */
                <>
                    <Pagination data={servers} onPageSelect={setPage}>
                        {({ items }) => renderServers(items)}
                    </Pagination>
                    <p css={tw`mt-4 text-xs text-neutral-500`}>
                        Showing {servers.pagination.total} {servers.pagination.total === 1 ? 'server' : 'servers'}
                    </p>
                </>
            ) : (
                <Spinner centered size={'large'} />
            )}
        </PageContentBlock>
    );
};
