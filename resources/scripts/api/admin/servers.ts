import { adminHttp } from '@/api/admin/http';
import { AdminPagination } from '@/api/admin/nodes';

export interface ServerSummary {
    id: number;
    name: string;
    uuid: string;
    uuid_short: string;
    owner: {
        id: number;
        username: string;
    } | null;
    node: {
        id: number;
        name: string;
    } | null;
    allocation: {
        alias: string | null;
        port: number;
    } | null;
    status: 'active' | 'installing' | 'suspended';
}

export interface ServerDetail {
    id: number;
    name: string;
    description: string | null;
    external_id: string | null;
    uuid: string;
    uuid_short: string;
    cpu: number;
    threads: string | null;
    memory: number;
    swap: number;
    disk: number;
    io: number;
    status: string | null;
    is_installed: boolean;
    is_suspended: boolean;
    nest: {
        id: number;
        name: string;
    } | null;
    egg: {
        id: number;
        name: string;
    } | null;
    owner: {
        id: number;
        username: string;
        email?: string;
    } | null;
    node: {
        id: number;
        name: string;
    } | null;
    allocation: {
        ip: string;
        alias: string;
        port: number;
        has_alias: boolean;
    } | null;
}

export interface ServerDetailsForm {
    id: number;
    name: string;
    external_id: string | null;
    description: string | null;
    owner_id: number;
    owner: {
        id: number;
        email: string;
        username: string;
        name_first: string;
        name_last: string;
    } | null;
}

export interface ServerAllocationOption {
    id: number;
    label: string;
}

export interface ServerBuildData {
    server: {
        id: number;
        allocation_id: number;
        cpu: number;
        threads: string | null;
        memory: number;
        swap: number;
        disk: number;
        io: number;
        oom_disabled: boolean;
        database_limit: number | null;
        allocation_limit: number | null;
        backup_limit: number | null;
        subdomain_limit: number | null;
    };
    assigned_allocations: ServerAllocationOption[];
    unassigned_allocations: ServerAllocationOption[];
}

export interface StartupEggVariable {
    env_variable: string;
    name: string;
    description: string;
    default_value: string;
    rules: string;
    required: boolean;
}

export interface StartupEgg {
    id: number;
    name: string;
    nest_id: number;
    startup: string | null;
    docker_images: Record<string, string>;
    variables: StartupEggVariable[];
}

export interface StartupNest {
    id: number;
    name: string;
    startup: string | null;
    eggs: StartupEgg[];
}

export interface ServerStartupData {
    server: {
        startup: string;
        nest_id: number;
        egg_id: number;
        image: string;
        skip_scripts: boolean;
    };
    variables: Record<string, string>;
    nests: StartupNest[];
}

export interface ServerDatabaseEntry {
    id: number;
    database: string;
    username: string;
    remote: string;
    max_connections: number | null;
    host: {
        id: number;
        name: string;
        host: string;
        port: number;
    } | null;
}

export interface ServerMountEntry {
    id: number;
    name: string;
    source: string;
    target: string;
    mounted: boolean;
}

export interface ServerManageData {
    server: {
        id: number;
        is_installed: boolean;
        is_suspended: boolean;
        status: string | null;
        node_id: number;
        transfer: {
            created_at: string;
        } | null;
    };
    can_transfer: boolean;
    node_options: {
        id: number;
        text: string;
        allocations: {
            id: number;
            text: string;
        }[];
    }[];
}

export interface ServerListResponse {
    servers: ServerSummary[];
    pagination: AdminPagination;
}

export interface ServerDetailResponse {
    server: ServerDetail;
}

export interface ServerListParams {
    page?: number;
    filter?: {
        '*'?: string;
        owner_id?: number;
    };
}

const buildListQuery = (params?: ServerListParams): string => {
    const search = new URLSearchParams();

    if (params?.page) {
        search.set('page', String(params.page));
    }

    if (params?.filter?.['*']) {
        search.set('filter[*]', params.filter['*']);
    }

    if (params?.filter?.owner_id) {
        search.set('filter[owner_id]', String(params.filter.owner_id));
    }

    const query = search.toString();

    return query ? `?${query}` : '';
};

export interface ServerCreateLocation {
    id: number;
    short: string;
    long: string | null;
    nodes: {
        id: number;
        name: string;
    }[];
}

export interface ServerCreateMeta {
    has_locations: boolean;
    has_nodes: boolean;
    locations: ServerCreateLocation[];
    node_options: {
        id: number;
        text: string;
        allocations: {
            id: number;
            text: string;
        }[];
    }[];
    nests: StartupNest[];
}

export interface ServerCreatePayload {
    name: string;
    owner_id: number;
    description?: string | null;
    start_on_completion?: boolean;
    node_id: number;
    allocation_id: number;
    allocation_additional?: number[];
    cpu: number;
    memory: number;
    disk: number;
    swap: number;
    io: number;
    threads?: string | null;
    oom_disabled?: boolean;
    database_limit?: number | null;
    allocation_limit?: number | null;
    backup_limit?: number | null;
    subdomain_limit?: number | null;
    nest_id: number;
    egg_id: number;
    startup: string;
    image: string;
    custom_image?: string;
    skip_scripts?: boolean;
    environment: Record<string, string>;
}

export const getServerCreateMeta = (): Promise<ServerCreateMeta> =>
    adminHttp.get<ServerCreateMeta>('/api/admin/servers/create').then((response) => response.data);

export const createServer = (
    data: ServerCreatePayload
): Promise<{ success: boolean; message: string; server: { id: number } }> =>
    adminHttp
        .post<{ success: boolean; message: string; server: { id: number } }>('/api/admin/servers', data)
        .then((response) => response.data);

export const getServers = (params?: ServerListParams): Promise<ServerListResponse> =>
    adminHttp.get<ServerListResponse>(`/api/admin/servers${buildListQuery(params)}`).then((response) => response.data);

export const getServer = (id: number): Promise<ServerDetailResponse> =>
    adminHttp.get<ServerDetailResponse>(`/api/admin/servers/${id}`).then((response) => response.data);

export const duplicateServer = (id: number): Promise<{ success: boolean; message: string; server: { id: number } }> =>
    adminHttp
        .post<{ success: boolean; message: string; server: { id: number } }>(`/api/admin/servers/${id}/duplicate`)
        .then((response) => response.data);

export const getServerDetails = (id: number): Promise<{ server: ServerDetailsForm }> =>
    adminHttp.get<{ server: ServerDetailsForm }>(`/api/admin/servers/${id}/details`).then((response) => response.data);

export const updateServerDetails = (
    id: number,
    data: { name: string; external_id?: string | null; owner_id: number; description?: string | null }
): Promise<{ success: boolean; message: string }> =>
    adminHttp
        .patch<{ success: boolean; message: string }>(`/api/admin/servers/${id}/details`, data)
        .then((response) => response.data);

export const getServerBuild = (id: number): Promise<ServerBuildData> =>
    adminHttp.get<ServerBuildData>(`/api/admin/servers/${id}/build`).then((response) => response.data);

export const updateServerBuild = (id: number, data: Record<string, unknown>): Promise<{ success: boolean; message: string }> =>
    adminHttp
        .patch<{ success: boolean; message: string }>(`/api/admin/servers/${id}/build`, data)
        .then((response) => response.data);

export const getServerStartup = (id: number): Promise<ServerStartupData> =>
    adminHttp.get<ServerStartupData>(`/api/admin/servers/${id}/startup`).then((response) => response.data);

export const updateServerStartup = (id: number, data: Record<string, unknown>): Promise<{ success: boolean; message: string }> =>
    adminHttp
        .patch<{ success: boolean; message: string }>(`/api/admin/servers/${id}/startup`, data)
        .then((response) => response.data);

export const getServerDatabases = (id: number): Promise<{ databases: ServerDatabaseEntry[]; hosts: { id: number; name: string }[] }> =>
    adminHttp
        .get<{ databases: ServerDatabaseEntry[]; hosts: { id: number; name: string }[] }>(`/api/admin/servers/${id}/databases`)
        .then((response) => response.data);

export const createServerDatabase = (
    id: number,
    data: { database_host_id: number; database: string; remote: string; max_connections?: number | null }
): Promise<{ success: boolean; message: string }> =>
    adminHttp
        .post<{ success: boolean; message: string }>(`/api/admin/servers/${id}/databases`, data)
        .then((response) => response.data);

export const resetServerDatabasePassword = (
    id: number,
    databaseId: number
): Promise<{ success: boolean; message: string }> =>
    adminHttp
        .patch<{ success: boolean; message: string }>(`/api/admin/servers/${id}/databases/reset-password`, {
            database: databaseId,
        })
        .then((response) => response.data);

export const deleteServerDatabase = (id: number, databaseId: number): Promise<{ success: boolean; message: string }> =>
    adminHttp
        .delete<{ success: boolean; message: string }>(`/api/admin/servers/${id}/databases/${databaseId}`)
        .then((response) => response.data);

export const getServerMounts = (id: number): Promise<{ mounts: ServerMountEntry[] }> =>
    adminHttp.get<{ mounts: ServerMountEntry[] }>(`/api/admin/servers/${id}/mounts`).then((response) => response.data);

export const addServerMount = (id: number, mountId: number): Promise<{ success: boolean; message: string }> =>
    adminHttp
        .post<{ success: boolean; message: string }>(`/api/admin/servers/${id}/mounts`, { mount_id: mountId })
        .then((response) => response.data);

export const removeServerMount = (id: number, mountId: number): Promise<{ success: boolean; message: string }> =>
    adminHttp
        .delete<{ success: boolean; message: string }>(`/api/admin/servers/${id}/mounts/${mountId}`)
        .then((response) => response.data);

export const getServerManage = (id: number): Promise<ServerManageData> =>
    adminHttp.get<ServerManageData>(`/api/admin/servers/${id}/manage`).then((response) => response.data);

export const reinstallServer = (id: number): Promise<{ success: boolean; message: string }> =>
    adminHttp.post<{ success: boolean; message: string }>(`/api/admin/servers/${id}/reinstall`).then((response) => response.data);

export const toggleServerInstall = (id: number): Promise<{ success: boolean; message: string }> =>
    adminHttp
        .post<{ success: boolean; message: string }>(`/api/admin/servers/${id}/toggle-install`)
        .then((response) => response.data);

export const suspendServer = (id: number, action: 'suspend' | 'unsuspend'): Promise<{ success: boolean; message: string }> =>
    adminHttp
        .post<{ success: boolean; message: string }>(`/api/admin/servers/${id}/suspend`, { action })
        .then((response) => response.data);

export const transferServer = (
    id: number,
    data: { node_id: number; allocation_id: number; allocation_additional?: number[] }
): Promise<{ success: boolean; message: string }> =>
    adminHttp
        .post<{ success: boolean; message: string }>(`/api/admin/servers/${id}/transfer`, data)
        .then((response) => response.data);

export const deleteServer = (id: number, force = false): Promise<{ success: boolean; message: string }> =>
    adminHttp
        .delete<{ success: boolean; message: string }>(`/api/admin/servers/${id}${force ? '?force=1' : ''}`)
        .then((response) => response.data);

export { searchUsers } from '@/api/admin/users';
export type { UserSearchResult } from '@/api/admin/users';
