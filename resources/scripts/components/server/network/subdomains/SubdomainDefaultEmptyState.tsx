import React from 'react';
import Can from '@/components/elements/Can';
import { Button } from '@/components/elements/button/index';

interface Props {
    subdomainLimit: number;
    templateCount: number;
    eggName: string;
    onCreateSubdomain: () => void;
    canCreate: boolean;
}

const SubdomainDefaultEmptyState = ({
    subdomainLimit,
    templateCount,
    eggName,
    onCreateSubdomain,
    canCreate,
}: Props) => {
    const message =
        subdomainLimit <= 0
            ? 'Subdomains are disabled for this server. An administrator must set a subdomain limit in the server build settings.'
            : templateCount <= 0
            ? `No DNS record template is configured for the ${eggName} egg. An administrator must create one under Admin → Subdomains → Record Templates and link it to this egg.`
            : 'Create a subdomain to point a hostname at this server through your configured DNS provider.';

    return (
        <div className={'flex flex-col items-center justify-center py-16'}>
            <h3 className={'text-lg font-semibold text-neutral-100 mb-1'}>No subdomains yet</h3>
            <p className={'text-sm text-neutral-400 text-center max-w-md'}>{message}</p>

            {canCreate && (
                <Can action={'subdomain.create'}>
                    <div className={'mt-6'}>
                        <Button type={'button'} onClick={onCreateSubdomain}>
                            New Subdomain
                        </Button>
                    </div>
                </Can>
            )}
        </div>
    );
};

export default SubdomainDefaultEmptyState;
