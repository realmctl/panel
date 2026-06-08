import React, { useCallback, useEffect, useState } from 'react';
import { useHistory, useParams, useRouteMatch } from 'react-router-dom';
import Spinner from '@/components/elements/Spinner';
import { useFlashKey } from '@/plugins/useFlash';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { ServerContext } from '@/state/server';
import AllocationRow from '@/components/server/network/AllocationRow';
import NetworkDefaultEmptyState from '@/components/server/network/NetworkDefaultEmptyState';
import Button from '@/components/elements/Button';
import createServerAllocation from '@/api/server/network/createServerAllocation';
import Can from '@/components/elements/Can';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import getServerAllocations from '@/api/swr/getServerAllocations';
import isEqual from 'react-fast-compare';
import { useDeepCompareEffect } from '@/plugins/useDeepCompareEffect';
import RealmTabBar from '@/components/elements/realm/RealmTabBar';
import SubdomainsPanel from '@/components/server/network/subdomains/SubdomainsPanel';

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

            <div className={'mb-6'}>
                <RealmTabBar
                    tabs={[
                        { id: 'allocations', label: 'Allocations' },
                        { id: 'subdomains', label: 'Subdomains' },
                    ]}
                    activeTab={activeTab}
                    onTabChange={switchTab}
                />
            </div>

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
                    {canCreateAllocation && (
                        <Can action={'allocation.create'}>
                            <div className={'flex justify-end mb-4'}>
                                <Button color={'primary'} onClick={onCreateAllocation}>
                                    Add Allocation
                                </Button>
                            </div>
                        </Can>
                    )}

                    <div className={'grid grid-cols-1 lg:grid-cols-2 gap-4'}>
                        {data.map((allocation) => (
                            <AllocationRow key={`${allocation.ip}:${allocation.port}`} allocation={allocation} />
                        ))}
                    </div>
                </>
            )}
        </ServerContentBlock>
    );
};

export default NetworkContainer;
