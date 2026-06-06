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
        <div
            className={'rounded-lg overflow-hidden flex flex-col transition-shadow duration-150'}
            style={{
                backgroundColor: '#192024',
                border: '1px solid #2d3338',
            }}
        >
            <div
                className={'flex items-center justify-between px-4 py-3'}
                style={{ backgroundColor: '#0e1417', borderBottom: '1px solid #2d3338' }}
            >
                <div className={'flex items-center gap-2'}>
                    <span
                        className={'flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded uppercase tracking-wide'}
                        style={{ backgroundColor: '#252a30', color: '#cbd5e1', border: '1px solid #3d454d' }}
                    >
                        <FontAwesomeIcon icon={faSitemap} className={'text-xs'} />
                        {subdomain.type}
                    </span>
                </div>

                <Can action={'subdomain.delete'}>
                    <DeleteSubdomainButton subdomainId={subdomain.id} fqdn={fqdn} />
                </Can>
            </div>

            <div className={'px-4 py-4'}>
                <p className={'text-xs uppercase tracking-wide text-neutral-500 mb-2'}>Hostname</p>
                <CopyOnClick text={fqdn}>
                    <div
                        className={'inline-flex items-center rounded-md px-3 py-2 font-mono text-sm cursor-pointer transition-colors duration-150 hover:border-neutral-600'}
                        style={{ backgroundColor: '#0e1417', border: '1px solid #2d3338' }}
                    >
                        <span className={'text-neutral-200'}>{subdomain.name}</span>
                        <span className={'text-neutral-600 mx-1'}>.</span>
                        <span className={'text-neutral-400'}>{domain}</span>
                    </div>
                </CopyOnClick>
            </div>
        </div>
    );
};

export default memo(SubdomainRow, isEqual);
