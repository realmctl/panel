import { adminHttp } from '@/api/admin/http';

export interface NodeLocationRef {
    id: number;
    short: string;
    long?: string | null;
}

export interface NodeSummary {
    id: number;
    name: string;
    fqdn: string;
    location: NodeLocationRef;
    memory: number;
    disk: number;
    servers_count: number;
    scheme: 'https' | 'http';
    public: boolean;
    maintenance_mode: boolean;
}

export interface AdminPagination {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface NodeListResponse {
    nodes: NodeSummary[];
    pagination: AdminPagination;
}

export interface NodeHealthResponse {
    version?: string;
    error?: string;
}

export interface NodeLocationOption {
    id: number;
    short: string;
    long: string | null;
}

export interface NodeCreateMetaResponse {
    locations: NodeLocationOption[];
    panel_secure: boolean;
    latest_daemon_version: string;
}

export interface NodeFormData {
    name: string;
    description?: string;
    location_id: number;
    fqdn: string;
    scheme: 'https' | 'http';
    behind_proxy: boolean | number;
    public: boolean | number;
    memory: number | string;
    memory_overallocate: number | string;
    disk: number | string;
    disk_overallocate: number | string;
    daemonBase: string;
    daemonListen: number | string;
    daemonSFTP: number | string;
    maintenance_mode?: boolean | number;
    upload_size?: number | string;
    reset_secret?: boolean;
}

export interface NodeUsageStat {
    value: string;
    max: string;
    percent: number;
    css: 'green' | 'yellow' | 'red';
}

export interface NodeAboutDetail {
    id: number;
    name: string;
    description: string | null;
    fqdn: string;
    maintenance_mode: boolean;
    servers_count: number;
    location: NodeLocationRef;
}

export interface NodeAboutResponse {
    node: NodeAboutDetail;
    stats: {
        memory: NodeUsageStat;
        disk: NodeUsageStat;
    };
    latest_daemon_version: string;
}

export interface NodeSettingsDetail {
    id: number;
    name: string;
    description: string | null;
    location_id: number;
    public: boolean;
    fqdn: string;
    scheme: 'https' | 'http';
    behind_proxy: boolean;
    maintenance_mode: boolean;
    memory: number;
    memory_overallocate: number;
    disk: number;
    disk_overallocate: number;
    upload_size: number;
    daemonBase: string;
    daemonListen: number;
    daemonSFTP: number;
}

export interface NodeSettingsResponse {
    node: NodeSettingsDetail;
    locations: NodeLocationOption[];
    panel_secure: boolean;
}

export interface NodeConfigurationResponse {
    yaml: string;
}

export interface NodeDeployTokenResponse {
    node: number;
    token: string;
    panel_url: string;
    debug: boolean;
}

export interface NodeSystemInformationResponse {
    version: string;
    system: {
        type: string;
        arch: string;
        release: string;
        cpus: number;
    };
}

export interface NodeServerSummary {
    id: number;
    name: string;
    uuid_short: string;
    owner: {
        id: number;
        username: string;
    };
    allocation: {
        alias: string;
        port: number;
    };
    status: 'active' | 'installing' | 'suspended';
}

export interface NodeServersResponse {
    servers: NodeServerSummary[];
    pagination: AdminPagination;
}

export interface NodeMutationResponse {
    success: boolean;
    message: string;
    node: {
        id: number;
        name: string;
    };
    redirect?: 'allocation' | 'node';
}

export interface NodeListParams {
    page?: number;
    filter?: {
        name?: string;
    };
}

const buildListQuery = (params?: NodeListParams): string => {
    const search = new URLSearchParams();

    if (params?.page) {
        search.set('page', String(params.page));
    }

    if (params?.filter?.name) {
        search.set('filter[name]', params.filter.name);
    }

    const query = search.toString();

    return query ? `?${query}` : '';
};

export const getNodes = (params?: NodeListParams): Promise<NodeListResponse> =>
    adminHttp.get<NodeListResponse>(`/api/admin/nodes${buildListQuery(params)}`).then((response) => response.data);

export const getNodeCreateMeta = (): Promise<NodeCreateMetaResponse> =>
    adminHttp.get<NodeCreateMetaResponse>('/api/admin/nodes/create').then((response) => response.data);

export const createNode = (data: NodeFormData): Promise<NodeMutationResponse> =>
    adminHttp.post<NodeMutationResponse>('/api/admin/nodes', data).then((response) => response.data);

export const getNode = (id: number): Promise<NodeAboutResponse> =>
    adminHttp.get<NodeAboutResponse>(`/api/admin/nodes/${id}`).then((response) => response.data);

export const getNodeSettings = (id: number): Promise<NodeSettingsResponse> =>
    adminHttp.get<NodeSettingsResponse>(`/api/admin/nodes/${id}/settings`).then((response) => response.data);

export const updateNode = (id: number, data: Partial<NodeFormData>): Promise<NodeMutationResponse> =>
    adminHttp.patch<NodeMutationResponse>(`/api/admin/nodes/${id}/settings`, data).then((response) => response.data);

export const getNodeConfiguration = (id: number): Promise<NodeConfigurationResponse> =>
    adminHttp.get<NodeConfigurationResponse>(`/api/admin/nodes/${id}/configuration`).then((response) => response.data);

export const generateNodeDeployToken = (id: number): Promise<NodeDeployTokenResponse> =>
    adminHttp.post<NodeDeployTokenResponse>(`/api/admin/nodes/${id}/deploy-token`).then((response) => response.data);

export const getNodeHealth = (id: number): Promise<NodeHealthResponse> =>
    adminHttp.get<NodeHealthResponse>(`/api/admin/nodes/${id}/health`).then((response) => response.data);

export const getNodeSystemInformation = (id: number): Promise<NodeSystemInformationResponse> =>
    adminHttp
        .get<NodeSystemInformationResponse>(`/api/admin/nodes/${id}/system-information`)
        .then((response) => response.data);

export const getNodeServers = (id: number, page = 1): Promise<NodeServersResponse> =>
    adminHttp
        .get<NodeServersResponse>(`/api/admin/nodes/${id}/servers?page=${page}`)
        .then((response) => response.data);

export const deleteNode = (id: number): Promise<{ success: boolean; message: string }> =>
    adminHttp.delete<{ success: boolean; message: string }>(`/api/admin/nodes/${id}`).then((response) => response.data);

export interface NodeAllocationSummary {
    id: number;
    ip: string;
    ip_alias: string | null;
    port: number;
    server_id: number | null;
    server: {
        id: number;
        name: string;
    } | null;
}

export interface NodeAllocationsResponse {
    allocations: NodeAllocationSummary[];
    ips: string[];
    pagination: AdminPagination;
}

export interface NodeAllocationFormData {
    allocation_ip: string;
    allocation_alias?: string;
    allocation_ports: string[];
}

export const getNodeAllocations = (id: number, page = 1): Promise<NodeAllocationsResponse> =>
    adminHttp
        .get<NodeAllocationsResponse>(`/api/admin/nodes/${id}/allocations?page=${page}`)
        .then((response) => response.data);

export const createNodeAllocations = (
    id: number,
    data: NodeAllocationFormData
): Promise<{ success: boolean; message: string }> =>
    adminHttp
        .post<{ success: boolean; message: string }>(`/api/admin/nodes/${id}/allocations`, data)
        .then((response) => response.data);

export const updateNodeAllocationAlias = (
    nodeId: number,
    allocationId: number,
    alias: string
): Promise<{ success: boolean; message: string }> =>
    adminHttp
        .patch<{ success: boolean; message: string }>(`/api/admin/nodes/${nodeId}/allocations/alias`, {
            allocation_id: allocationId,
            alias,
        })
        .then((response) => response.data);

export const deleteNodeAllocation = (
    nodeId: number,
    allocationId: number
): Promise<{ success: boolean; message: string }> =>
    adminHttp
        .delete<{ success: boolean; message: string }>(`/api/admin/nodes/${nodeId}/allocations/${allocationId}`)
        .then((response) => response.data);

export const deleteNodeAllocations = (
    nodeId: number,
    allocations: { id: number }[]
): Promise<{ success: boolean; message: string }> =>
    adminHttp
        .delete<{ success: boolean; message: string }>(`/api/admin/nodes/${nodeId}/allocations`, { allocations })
        .then((response) => response.data);

export const deleteNodeAllocationBlock = (
    nodeId: number,
    ip: string
): Promise<{ success: boolean; message: string }> =>
    adminHttp
        .delete<{ success: boolean; message: string }>(`/api/admin/nodes/${nodeId}/allocations/block`, { ip })
        .then((response) => response.data);
