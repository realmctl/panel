import React, { useEffect, useState } from 'react';
import { Server } from '@/api/server/getServer';
import getServers from '@/api/getServers';
import ServerCard from '@/components/dashboard/ServerCard';
import ServerRow from '@/components/dashboard/ServerRow';
import GroupSection from '@/components/dashboard/groups/GroupSection';
import CreateGroupModal from '@/components/dashboard/groups/CreateGroupModal';
import { ServerGroup } from '@/api/account/serverGroups';
import Spinner from '@/components/elements/Spinner';
import PageContentBlock from '@/components/elements/PageContentBlock';
import useFlash from '@/plugins/useFlash';
import { useStoreState, useStoreActions } from 'easy-peasy';
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
    const fetchGroups = useStoreActions((a: ApplicationStore) => a.serverGroups.fetchGroups);

    const [showOnlyAdmin, setShowOnlyAdmin] = usePersistedState(`${uuid}:show_all_servers`, false);
    const [layout, setLayout] = usePersistedState<'grid' | 'list'>(`${uuid}:server_layout`, 'grid');
    const [collapsed, setCollapsed] = usePersistedState<Record<string, boolean>>(`${uuid}:group_collapsed`, {});
    const [modal, setModal] = useState<'create' | ServerGroup | null>(null);

    const { data: servers, error } = useSWR<PaginatedResult<Server>>(
        ['/api/client/servers', showOnlyAdmin && rootAdmin, page],
        () => getServers({ page, type: showOnlyAdmin && rootAdmin ? 'admin' : undefined })
    );

    useEffect(() => {
        fetchGroups();
    }, []);

    useEffect(() => {
        setPage(1);
    }, [showOnlyAdmin]);

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
        if (error) clearAndAddHttpError({ key: 'dashboard', error });
        if (!error) clearFlashes('dashboard');
    }, [error]);

    const toggleCollapse = (groupUuid: string) => {
        setCollapsed((prev) => ({ ...(prev ?? {}), [groupUuid]: !(prev ?? {})[groupUuid] }));
    };

    const allServers = servers?.items ?? [];

    // Partition servers into groups + ungrouped.
    const groupedServers = groups.map((group) => ({
        group,
        servers: allServers.filter((s) => group.serverUuids.includes(s.uuid)),
    }));

    const groupedUuids = new Set(groups.flatMap((g) => g.serverUuids));
    const ungrouped = allServers.filter((s) => !groupedUuids.has(s.uuid));

    const hasGroups = groups.length > 0;

    const renderServers = (items: Server[], color?: string) =>
        layout === 'grid' ? (
            <div className={'grid grid-cols-1 md:grid-cols-2 gap-4'}>
                {items.map((s) => <ServerCard key={s.uuid} server={s} groupColor={color} />)}
            </div>
        ) : (
            <div className={'flex flex-col gap-2'}>
                {items.map((s) => <ServerRow key={s.uuid} server={s} groupColor={color} />)}
            </div>
        );

    return (
        <PageContentBlock title={'Dashboard'} showFlashKey={'dashboard'}>
            {modal && (
                <CreateGroupModal
                    servers={allServers}
                    editing={modal === 'create' ? undefined : modal}
                    onClose={() => setModal(null)}
                />
            )}

            {/* Toolbar */}
            <div className={'mb-4 flex justify-between items-center gap-3'}>
                <div className={'flex items-center gap-2'}>
                    <button
                        onClick={() => setModal('create')}
                        className={
                            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border border-[#2d3338]/50 text-neutral-400 hover:text-neutral-200 hover:border-[#3d4348] transition-colors cursor-pointer bg-transparent'
                        }
                        style={{ backgroundColor: '#192024' }}
                    >
                        <svg xmlns={'http://www.w3.org/2000/svg'} className={'w-3.5 h-3.5'} viewBox={'0 0 24 24'} fill={'currentColor'}>
                            <path d={'M12 5v14M5 12h14'} stroke={'currentColor'} strokeWidth={2} strokeLinecap={'round'} fill={'none'} />
                        </svg>
                        New Group
                    </button>

                    {groups.length > 0 && (
                        <div className={'flex items-center gap-1.5 flex-wrap'}>
                            {groups.map((g) => (
                                <button
                                    key={g.uuid}
                                    onClick={() => setModal(g)}
                                    className={'flex items-center gap-1.5 px-2 py-1 rounded text-xs text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer border border-transparent hover:border-[#2d3338] bg-transparent'}
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
                </div>

                <div className={'flex items-center gap-3'}>
                    {rootAdmin && (
                        <div
                            className={'flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#2d3338]/50 cursor-pointer select-none transition-colors duration-150 hover:border-[#3d4348]'}
                            style={{ backgroundColor: '#192024' }}
                            onClick={() => setShowOnlyAdmin((s) => !s)}
                        >
                            <span className={'text-xs text-neutral-400'}>
                                {showOnlyAdmin ? "Others' servers" : 'Your servers'}
                            </span>
                            <div className={`relative w-8 h-4 rounded-full transition-colors duration-200 ${showOnlyAdmin ? 'bg-blue-500' : 'bg-neutral-600'}`}>
                                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 ${showOnlyAdmin ? 'translate-x-4' : 'translate-x-0.5'}`} />
                            </div>
                        </div>
                    )}

                    <div
                        className={'flex items-center rounded-md border border-[#2d3338]/50 overflow-hidden'}
                        style={{ backgroundColor: '#192024' }}
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
                </div>
            </div>

            {!servers ? (
                <Spinner centered size={'large'} />
            ) : allServers.length === 0 ? (
                <p css={tw`text-center text-sm text-neutral-400`}>
                    {showOnlyAdmin ? 'There are no other servers to display.' : 'There are no servers associated with your account.'}
                </p>
            ) : hasGroups ? (
                /* Grouped view — no pagination wrapper, all servers already loaded */
                <>
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
            ) : (
                /* No groups — use pagination as before */
                <Pagination data={servers} onPageSelect={setPage}>
                    {({ items }) => renderServers(items)}
                </Pagination>
            )}
        </PageContentBlock>
    );
};
