import React, { useCallback, useEffect, useState } from 'react';
import { useHistory, useParams, useRouteMatch } from 'react-router-dom';
import Spinner from '@/components/elements/Spinner';
import { useFlashKey } from '@/plugins/useFlash';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { ServerContext } from '@/state/server';
import AllocationRow from '@/components/server/network/AllocationRow';
import NetworkDefaultEmptyState from '@/components/server/network/NetworkDefaultEmptyState';
import createServerAllocation from '@/api/server/network/createServerAllocation';
import Can from '@/components/elements/Can';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import getServerAllocations from '@/api/swr/getServerAllocations';
import isEqual from 'react-fast-compare';
import { useDeepCompareEffect } from '@/plugins/useDeepCompareEffect';
import classNames from 'classnames';
import SubdomainsPanel from '@/components/server/network/subdomains/SubdomainsPanel';
import { realmClasses } from '@/lib/realmTokens';

type NetworkTab = 'allocations' | 'subdomains';

const NETWORK_TABS: NetworkTab[] = ['allocations', 'subdomains'];

const tabFromParam = (tab?: string): NetworkTab => {
    if (tab && NETWORK_TABS.includes(tab as NetworkTab)) {
        return tab as NetworkTab;
    }

    return 'allocations';
};

const NetworkContainer = () => {
    const history = useHistory();
    const { tab: tabParam } = useParams<{ tab?: string }>();
    const serverMatch = useRouteMatch<{ id: string }>('/server/:id');
    const activeTab = tabFromParam(tabParam);

    const [loading, setLoading] = useState(false);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const allocationLimit = ServerContext.useStoreState((state) => state.server.data!.featureLimits.allocations);
    const allocations = ServerContext.useStoreState((state) => state.server.data!.allocations, isEqual);
    const setServerFromState = ServerContext.useStoreActions((actions) => actions.server.setServerFromState);

    const { clearFlashes, clearAndAddHttpError } = useFlashKey('server:network');
    const { data, error, mutate } = getServerAllocations();

    useEffect(() => {
        mutate(allocations);
    }, []);

    useEffect(() => {
        clearAndAddHttpError(error);
    }, [error]);

    useDeepCompareEffect(() => {
        if (!data) return;
        setServerFromState((state) => ({ ...state, allocations: data }));
    }, [data]);

    const networkPath = useCallback(
        (tab: NetworkTab) => {
            const base = `${serverMatch!.url.replace(/\/?$/, '')}/network`;
            return tab === 'allocations' ? base : `${base}/${tab}`;
        },
        [serverMatch]
    );

    const switchTab = useCallback(
        (tab: NetworkTab) => {
            if (activeTab === tab) {
                return;
            }

            history.push(networkPath(tab));
        },
        [activeTab, history, networkPath]
    );

    const onCreateAllocation = () => {
        clearFlashes();
        setLoading(true);
        createServerAllocation(uuid)
            .then((allocation) => {
                setServerFromState((s) => ({ ...s, allocations: s.allocations.concat(allocation) }));
                return mutate(data?.concat(allocation), false);
            })
            .catch((error) => clearAndAddHttpError(error))
            .then(() => setLoading(false));
    };

    const hasOnlyDefaultAllocation = data?.length === 1 && data[0].isDefault;
    const canCreateAllocation = allocationLimit > 0 && !!data && allocationLimit > data.length;

    return (
        <ServerContentBlock showFlashKey={'server:network'} title={'Network'}>
            <SpinnerOverlay visible={loading} />

            <div className={'grid grid-cols-1 lg:grid-cols-[13rem_1fr] gap-6'}>
                <div
                    className={classNames(
                        'flex lg:flex-col gap-1 p-1 rounded-md flex-shrink-0 lg:self-start',
                        realmClasses.tabBar
                    )}
                >
                    {(
                        [
                            { id: 'allocations', label: 'Allocations' },
                            { id: 'subdomains', label: 'Subdomains' },
                        ] as { id: NetworkTab; label: string }[]
                    ).map((tab) => {
                        const active = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                type={'button'}
                                onClick={() => switchTab(tab.id)}
                                className={classNames(
                                    'flex-1 lg:flex-none text-left px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 border-0 cursor-pointer',
                                    active ? realmClasses.tabActive : realmClasses.tabInactive
                                )}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className={'min-w-0'}>
                    {activeTab === 'subdomains' ? (
                        <SubdomainsPanel />
                    ) : !data ? (
                        <Spinner size={'large'} centered />
                    ) : hasOnlyDefaultAllocation ? (
                        <NetworkDefaultEmptyState
                            allocation={data[0]}
                            onCreateAllocation={onCreateAllocation}
                            canCreateAllocation={canCreateAllocation}
                        />
                    ) : (
                        <>
                            <div
                                className={
                                    'rounded-md border border-realm-border/50 bg-realm-card overflow-hidden'
                                }
                            >
                                <div className={'hidden sm:grid grid-cols-12 gap-4 px-4 py-2 border-b border-realm-border/50'}>
                                    <div className={'col-span-3 text-xs font-medium uppercase tracking-wide text-neutral-500'}>
                                        Address
                                    </div>
                                    <div className={'col-span-1 text-xs font-medium uppercase tracking-wide text-neutral-500'}>
                                        Protocol
                                    </div>
                                    <div className={'col-span-2 text-xs font-medium uppercase tracking-wide text-neutral-500'}>
                                        Firewall
                                    </div>
                                    <div className={'col-span-3 text-xs font-medium uppercase tracking-wide text-neutral-500'}>
                                        Notes
                                    </div>
                                    <div className={'col-span-3'} />
                                </div>
                                <div className={'divide-y divide-realm-border/50'}>
                                    {data.map((allocation) => (
                                        <AllocationRow key={`${allocation.ip}:${allocation.port}`} allocation={allocation} />
                                    ))}
                                </div>
                            </div>

                            <div className={'flex flex-wrap items-center justify-between gap-2 mt-4'}>
                                {canCreateAllocation ? (
                                    <Can action={'allocation.create'}>
                                        <p className={'text-sm text-neutral-500 m-0'}>
                                            Need another port?{' '}
                                            <button
                                                type={'button'}
                                                onClick={onCreateAllocation}
                                                className={'bg-transparent border-0 p-0 text-blue-600 hover:text-blue-500 cursor-pointer'}
                                            >
                                                Create a new allocation
                                            </button>
                                            .
                                        </p>
                                    </Can>
                                ) : (
                                    <span />
                                )}
                                <p className={'text-xs text-neutral-600 m-0'}>
                                    Tip: right-click an allocation for more options.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </ServerContentBlock>
    );
};

export default NetworkContainer;
