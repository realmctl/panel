import { adminHttp } from '@/api/admin/http';

export interface OverviewStats {
    servers: number;
    users: number;
    nodes: number;
    locations: number;
    nests: number;
    mounts: number;
    database_hosts: number;
    subdomain_domains: number;
}

export interface OverviewResponse {
    stats: OverviewStats;
}

export const getOverview = (): Promise<OverviewResponse> =>
    adminHttp.get<OverviewResponse>('/api/admin/overview').then((response) => response.data);
