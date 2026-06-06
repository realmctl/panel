import useSWR from 'swr';
import http from '@/api/http';
import { ServerContext } from '@/state/server';

export interface SubdomainItem {
    id: number;
    name: string;
    type: string;
    domain: string | { id: number; name: string };
    domain_id: number;
    created_at: string;
}

export const subdomainDomainName = (subdomain: SubdomainItem): string =>
    typeof subdomain.domain === 'string' ? subdomain.domain : subdomain.domain?.name ?? '';

export interface SubdomainTemplate {
    id: number;
    name: string;
    domain: string;
}

export interface SubdomainListResult {
    domains: {
        data: SubdomainItem[];
        current_page: number;
        last_page: number;
        total: number;
    };
    templates: SubdomainTemplate[];
}

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    return useSWR<SubdomainListResult>(['server:network:subdomains', uuid], async () => {
        const { data } = await http.get(`/api/client/servers/${uuid}/network/subdomains`);

        return {
            domains: data.domains,
            templates: data.template,
        };
    });
};
