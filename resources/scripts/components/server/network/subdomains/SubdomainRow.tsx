import React, { memo } from 'react';
import isEqual from 'react-fast-compare';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSitemap } from '@fortawesome/free-solid-svg-icons';
import Can from '@/components/elements/Can';
import CopyOnClick from '@/components/elements/CopyOnClick';
import DeleteSubdomainButton from '@/components/server/network/subdomains/DeleteSubdomainButton';
import { SubdomainItem, subdomainDomainName } from '@/api/server/network/subdomains/getSubdomains';

interface Props {
    subdomain: SubdomainItem;
}

const SubdomainRow = ({ subdomain }: Props) => {
    const domain = subdomainDomainName(subdomain);
    const fqdn = `${subdomain.name}.${domain}`;

    return (
        <div className={'grid grid-cols-12 gap-4 items-center px-4 py-3 transition-colors duration-150 hover:bg-white/[0.02]'}>
            <div className={'col-span-12 sm:col-span-7 min-w-0'}>
                <CopyOnClick text={fqdn}>
                    <span
                        className={'font-mono text-sm text-neutral-200 hover:text-neutral-100 cursor-pointer truncate block'}
                    >
                        {subdomain.name}
                        <span className={'text-neutral-600'}>.</span>
                        <span className={'text-neutral-400'}>{domain}</span>
                    </span>
                </CopyOnClick>
            </div>

            <div className={'col-span-6 sm:col-span-2'}>
                <span
                    className={'inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded uppercase tracking-wide'}
                    style={{ backgroundColor: '#252a30', color: '#cbd5e1', border: '1px solid #3d454d' }}
                >
                    <FontAwesomeIcon icon={faSitemap} className={'text-xs'} />
                    {subdomain.type}
                </span>
            </div>

            <div className={'col-span-6 sm:col-span-3 flex items-center justify-end'}>
                <Can action={'subdomain.delete'}>
                    <DeleteSubdomainButton subdomainId={subdomain.id} fqdn={fqdn} />
                </Can>
            </div>
        </div>
    );
};

export default memo(SubdomainRow, isEqual);
