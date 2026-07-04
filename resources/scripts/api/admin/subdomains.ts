import { adminHttp } from '@/api/admin/http';

export interface DnsProviderConfig {
    title: string;
    secret: boolean;
    consumer: boolean;
    cloudflare_id: boolean;
    ovh_api: boolean;
}

export type DnsProviders = Record<string, DnsProviderConfig>;

export interface SubdomainDomainSummary {
    id: number;
    name: string;
    type: string;
    display_type: string;
}

export interface SubdomainDomainDetail {
    id: number;
    name: string;
    type: string;
    display_type: string;
    cloudflare_id: string | null;
    ovh_api: string | null;
}

export interface SubdomainRecordSummary {
    id: number;
    name: string;
    type: string;
    domain: {
        id: number;
        name: string;
    };
}

export interface SubdomainRecordDetail {
    id: number;
    name: string;
    type: string;
    domain_id: number;
    ttl: string | null;
    protocol: string | null;
    priority: string | null;
    weight: string | null;
    service: string | null;
}

export interface SubdomainOption {
    id: number;
    name: string;
}

export interface PaginationMeta {
    current_page: number;
    last_page: number;
    total: number;
}

export interface DomainListResponse {
    domains: SubdomainDomainSummary[];
}

export interface DomainCreateMetaResponse {
    providers: DnsProviders;
}

export interface DomainShowResponse {
    domain: SubdomainDomainDetail;
    providers: DnsProviders;
}

export interface DomainStorePayload {
    name: string;
    type: string;
    key: string;
    secret?: string;
    consumer?: string;
    cloudflare_id?: string;
    ovh_api?: string;
}

export interface RecordListResponse {
    records: SubdomainRecordSummary[];
    pagination: PaginationMeta;
}

export interface RecordCreateMetaResponse {
    domains: SubdomainOption[];
    eggs: SubdomainOption[];
}

export interface RecordShowResponse {
    record: SubdomainRecordDetail;
    domains: SubdomainOption[];
    eggs: SubdomainOption[];
    egg_ids: number[];
}

export interface RecordStorePayload {
    name: string;
    type: string;
    domain_id: number;
    egg_ids: number[];
    ttl?: string;
    protocol?: string;
    priority?: string;
    weight?: string;
    service?: string;
}

export interface CloudflareZone {
    id: string;
    name: string;
}

export interface CloudflareZonesResponse {
    zones: CloudflareZone[];
}

export const getSubdomainDomains = (): Promise<DomainListResponse> =>
    adminHttp.get<DomainListResponse>('/api/admin/subdomains/domains').then((response) => response.data);

export const getCloudflareZones = (apiToken: string): Promise<CloudflareZonesResponse> =>
    adminHttp
        .post<CloudflareZonesResponse>('/api/admin/subdomains/domains/cloudflare/zones', { api_token: apiToken })
        .then((response) => response.data);

export const getSubdomainDomainCreateMeta = (): Promise<DomainCreateMetaResponse> =>
    adminHttp.get<DomainCreateMetaResponse>('/api/admin/subdomains/domains/create').then((response) => response.data);

export const getSubdomainDomain = (id: number): Promise<DomainShowResponse> =>
    adminHttp.get<DomainShowResponse>(`/api/admin/subdomains/domains/${id}`).then((response) => response.data);

export const createSubdomainDomain = (payload: DomainStorePayload) =>
    adminHttp.post('/api/admin/subdomains/domains', payload).then((response) => response.data);

export const updateSubdomainDomain = (id: number, payload: DomainStorePayload) =>
    adminHttp.patch(`/api/admin/subdomains/domains/${id}`, payload).then((response) => response.data);

export const deleteSubdomainDomain = (id: number) => adminHttp.delete(`/api/admin/subdomains/domains/${id}`);

export const getSubdomainRecords = (page = 1): Promise<RecordListResponse> =>
    adminHttp
        .get<RecordListResponse>(`/api/admin/subdomains/records?page=${page}`)
        .then((response) => response.data);

export const getSubdomainRecordCreateMeta = (): Promise<RecordCreateMetaResponse> =>
    adminHttp.get<RecordCreateMetaResponse>('/api/admin/subdomains/records/create').then((response) => response.data);

export const getSubdomainRecord = (id: number): Promise<RecordShowResponse> =>
    adminHttp.get<RecordShowResponse>(`/api/admin/subdomains/records/${id}`).then((response) => response.data);

export const createSubdomainRecord = (payload: RecordStorePayload) =>
    adminHttp.post('/api/admin/subdomains/records', payload).then((response) => response.data);

export const updateSubdomainRecord = (id: number, payload: RecordStorePayload) =>
    adminHttp.patch(`/api/admin/subdomains/records/${id}`, payload).then((response) => response.data);

export const deleteSubdomainRecord = (id: number) => adminHttp.delete(`/api/admin/subdomains/records/${id}`);
