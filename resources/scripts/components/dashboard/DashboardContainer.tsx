import React, { useEffect, useState } from 'react';
import { Server } from '@/api/server/getServer';
import getServers from '@/api/getServers';
import ServerCard from '@/components/dashboard/ServerCard';
import ServerRow from '@/components/dashboard/ServerRow';
import Spinner from '@/components/elements/Spinner';
import PageContentBlock from '@/components/elements/PageContentBlock';
import useFlash from '@/plugins/useFlash';
import { useStoreState } from 'easy-peasy';
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
    const uuid = useStoreState((state) => state.user.data!.uuid);
    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [showOnlyAdmin, setShowOnlyAdmin] = usePersistedState(`${uuid}:show_all_servers`, false);
    const [layout, setLayout] = usePersistedState<'grid' | 'list'>(`${uuid}:server_layout`, 'grid');

    const { data: servers, error } = useSWR<PaginatedResult<Server>>(
        ['/api/client/servers', showOnlyAdmin && rootAdmin, page],
        () => getServers({ page, type: showOnlyAdmin && rootAdmin ? 'admin' : undefined })
    );

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
        // Don't use react-router to handle changing this part of the URL, otherwise it
        // triggers a needless re-render. We just want to track this in the URL incase the
        // user refreshes the page.
        window.history.replaceState(null, document.title, `/${page <= 1 ? '' : `?page=${page}`}`);
    }, [page]);

    useEffect(() => {
        if (error) clearAndAddHttpError({ key: 'dashboard', error });
        if (!error) clearFlashes('dashboard');
    }, [error]);

    return (
        <PageContentBlock title={'Dashboard'} showFlashKey={'dashboard'}>
            <div className={'mb-4 flex justify-end items-center gap-3'}>
                {rootAdmin && (
                    <div
                        className={'flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#2d3338]/50 cursor-pointer select-none transition-colors duration-150 hover:border-[#3d4348]'}
                        style={{ backgroundColor: '#192024' }}
                        onClick={() => setShowOnlyAdmin((s) => !s)}
                    >
                        <span className={'text-xs text-neutral-400'}>
                            {showOnlyAdmin ? "Others' servers" : 'Your servers'}
                        </span>
                        <div
                            className={`relative w-8 h-4 rounded-full transition-colors duration-200 ${
                                showOnlyAdmin ? 'bg-blue-500' : 'bg-neutral-600'
                            }`}
                        >
                            <div
                                className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 ${
                                    showOnlyAdmin ? 'translate-x-4' : 'translate-x-0.5'
                                }`}
                            />
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
                        className={`p-1.5 transition-colors duration-150 border-0 cursor-pointer ${
                            layout === 'grid' ? 'text-neutral-100 bg-white/10' : 'text-neutral-500 hover:text-neutral-300 bg-transparent'
                        }`}
                    >
                        <svg xmlns={'http://www.w3.org/2000/svg'} className={'w-4 h-4'} viewBox={'0 0 24 24'} fill={'currentColor'}>
                            <path d={'M3 3h8v8H3V3zm0 10h8v8H3v-8zm10-10h8v8h-8V3zm0 10h8v8h-8v-8z'} />
                        </svg>
                    </button>
                    <button
                        onClick={() => setLayout('list')}
                        title={'List view'}
                        className={`p-1.5 transition-colors duration-150 border-0 cursor-pointer ${
                            layout === 'list' ? 'text-neutral-100 bg-white/10' : 'text-neutral-500 hover:text-neutral-300 bg-transparent'
                        }`}
                    >
                        <svg xmlns={'http://www.w3.org/2000/svg'} className={'w-4 h-4'} viewBox={'0 0 24 24'} fill={'currentColor'}>
                            <path d={'M3 5h18v2H3V5zm0 6h18v2H3v-2zm0 6h18v2H3v-2z'} />
                        </svg>
                    </button>
                </div>
            </div>
            {!servers ? (
                <Spinner centered size={'large'} />
            ) : (
                <Pagination data={servers} onPageSelect={setPage}>
                    {({ items }) =>
                        items.length > 0 ? (
                            layout === 'grid' ? (
                                <div className={'grid grid-cols-1 md:grid-cols-2 gap-4'}>
                                    {items.map((server) => (
                                        <ServerCard key={server.uuid} server={server} />
                                    ))}
                                </div>
                            ) : (
                                <div className={'flex flex-col gap-2'}>
                                    {items.map((server) => (
                                        <ServerRow key={server.uuid} server={server} />
                                    ))}
                                </div>
                            )
                        ) : (
                            <p css={tw`text-center text-sm text-neutral-400`}>
                                {showOnlyAdmin
                                    ? 'There are no other servers to display.'
                                    : 'There are no servers associated with your account.'}
                            </p>
                        )
                    }
                </Pagination>
            )}
        </PageContentBlock>
    );
};
