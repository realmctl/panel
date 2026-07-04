import React, { useEffect, useState } from 'react';
import Spinner from '@/components/elements/Spinner';
import Fade from '@/components/elements/Fade';
import Can from '@/components/elements/Can';
import { ServerContext } from '@/state/server';
import { useFlashKey } from '@/plugins/useFlash';
import getSubdomains from '@/api/server/network/subdomains/getSubdomains';
import SubdomainRow from '@/components/server/network/subdomains/SubdomainRow';
import CreateSubdomainDrawer from '@/components/server/network/subdomains/CreateSubdomainDrawer';
import SubdomainDefaultEmptyState from '@/components/server/network/subdomains/SubdomainDefaultEmptyState';

const SubdomainsPanel = () => {
    const [createVisible, setCreateVisible] = useState(false);
    const subdomainLimit = ServerContext.useStoreState(
        (state) => state.server.data!.featureLimits.subdomains ?? 0
    );
    const eggName = ServerContext.useStoreState((state) => state.server.data!.eggName);
    const { clearAndAddHttpError } = useFlashKey('server:network');
    const { data, error, isValidating } = getSubdomains();

    useEffect(() => {
        clearAndAddHttpError(error);
    }, [error]);

    if (!data && !error) {
        return <Spinner size={'large'} centered />;
    }

    const subdomains = data?.domains.data ?? [];
    const templates = data?.templates ?? [];
    const canCreate = subdomainLimit > 0 && subdomains.length < subdomainLimit && templates.length > 0;
    const hasSubdomains = subdomains.length > 0;

    return (
        <>
            <CreateSubdomainDrawer
                visible={createVisible}
                templates={templates}
                onDismissed={() => setCreateVisible(false)}
            />

            <Fade timeout={150}>
                <>
                    {!hasSubdomains ? (
                        <SubdomainDefaultEmptyState
                            subdomainLimit={subdomainLimit}
                            templateCount={templates.length}
                            eggName={eggName}
                            canCreate={canCreate}
                            onCreateSubdomain={() => setCreateVisible(true)}
                        />
                    ) : (
                        <div className={'rounded-md border border-realm-border/50 bg-realm-card overflow-hidden'}>
                            <div className={'hidden sm:grid grid-cols-12 gap-4 px-4 py-2 border-b border-realm-border/50'}>
                                <div className={'col-span-7 text-xs font-medium uppercase tracking-wide text-neutral-500'}>
                                    Hostname
                                </div>
                                <div className={'col-span-2 text-xs font-medium uppercase tracking-wide text-neutral-500'}>
                                    Type
                                </div>
                                <div className={'col-span-3'} />
                            </div>
                            <div className={'divide-y divide-realm-border/50'}>
                                {subdomains.map((subdomain) => (
                                    <SubdomainRow key={subdomain.id} subdomain={subdomain} />
                                ))}
                            </div>
                        </div>
                    )}

                    {canCreate && hasSubdomains && (
                        <Can action={'subdomain.create'}>
                            <p className={'text-sm text-neutral-500 mt-4 m-0'}>
                                {subdomains.length} of {subdomainLimit} subdomains allocated to this server.{' '}
                                <button
                                    type={'button'}
                                    onClick={() => setCreateVisible(true)}
                                    className={'bg-transparent border-0 p-0 text-blue-600 hover:text-blue-500 cursor-pointer'}
                                >
                                    Create a new subdomain
                                </button>
                                .
                            </p>
                        </Can>
                    )}

                    {isValidating && !hasSubdomains && <Spinner size={'large'} centered />}
                </>
            </Fade>
        </>
    );
};

export default SubdomainsPanel;
