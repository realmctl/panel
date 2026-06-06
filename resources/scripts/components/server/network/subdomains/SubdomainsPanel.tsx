import React, { useEffect, useState } from 'react';
import Spinner from '@/components/elements/Spinner';
import Fade from '@/components/elements/Fade';
import Can from '@/components/elements/Can';
import { Button } from '@/components/elements/button/index';
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
                    {canCreate && hasSubdomains && (
                        <Can action={'subdomain.create'}>
                            <div className={'flex items-center justify-between mb-4'}>
                                <span className={'text-sm text-neutral-400'}>
                                    {subdomains.length} of {subdomainLimit} subdomains allocated to this server.
                                </span>
                                <Button type={'button'} onClick={() => setCreateVisible(true)}>
                                    New Subdomain
                                </Button>
                            </div>
                        </Can>
                    )}

                    {!hasSubdomains ? (
                        <SubdomainDefaultEmptyState
                            subdomainLimit={subdomainLimit}
                            templateCount={templates.length}
                            eggName={eggName}
                            canCreate={canCreate}
                            onCreateSubdomain={() => setCreateVisible(true)}
                        />
                    ) : (
                        <div className={'grid grid-cols-1 lg:grid-cols-2 gap-4'}>
                            {subdomains.map((subdomain) => (
                                <SubdomainRow key={subdomain.id} subdomain={subdomain} />
                            ))}
                        </div>
                    )}

                    {isValidating && !hasSubdomains && <Spinner size={'large'} centered />}
                </>
            </Fade>
        </>
    );
};

export default SubdomainsPanel;
