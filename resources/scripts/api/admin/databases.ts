import { adminHttp } from '@/api/admin/http';

export interface DatabaseHostNode {
    id: number;
    name: string;
}

export interface DatabaseHostLocationOption {
    id: number;
    short: string;
    nodes: DatabaseHostNode[];
}

export interface DatabaseHostSummary {
    id: number;
    name: string;
    host: string;
    port: number;
    username: string;
    databases_count: number;
    node: DatabaseHostNode | null;
}

export interface DatabaseHostDetail {
    id: number;
    name: string;
    host: string;
    port: number;
    username: string;
    node_id: number | null;
}

export interface DatabaseOnHost {
    id: number;
    database: string;
    username: string;
    remote: string;
    max_connections: number | null;
    server: {
        id: number;
        name: string;
    };
}

export interface DatabaseHostListResponse {
    hosts: DatabaseHostSummary[];
}

export interface DatabaseHostCreateMetaResponse {
    locations: DatabaseHostLocationOption[];
}

export interface DatabaseHostShowResponse {
    host: DatabaseHostDetail;
    locations: DatabaseHostLocationOption[];
    databases: DatabaseOnHost[];
    pagination: {
        current_page: number;
        last_page: number;
        total: number;
    };
}

export interface DatabaseHostFormData {
    name: string;
    host: string;
    port: number | string;
    username: string;
    password?: string;
    node_id: number | null;
}

export interface DatabaseHostMutationResponse {
    success: boolean;
    message: string;
    host?: {
        id: number;
        name: string;
    };
}

export const getDatabaseHosts = (): Promise<DatabaseHostListResponse> =>
    adminHttp.get<DatabaseHostListResponse>('/api/admin/database-hosts').then((response) => response.data);

export const getDatabaseHostCreateMeta = (): Promise<DatabaseHostCreateMetaResponse> =>
    adminHttp.get<DatabaseHostCreateMetaResponse>('/api/admin/database-hosts/create').then((response) => response.data);

export const getDatabaseHost = (id: number): Promise<DatabaseHostShowResponse> =>
    adminHttp.get<DatabaseHostShowResponse>(`/api/admin/database-hosts/${id}`).then((response) => response.data);

export const createDatabaseHost = (data: DatabaseHostFormData): Promise<DatabaseHostMutationResponse> =>
    adminHttp.post<DatabaseHostMutationResponse>('/api/admin/database-hosts', data).then((response) => response.data);

export const updateDatabaseHost = (id: number, data: Partial<DatabaseHostFormData>): Promise<DatabaseHostMutationResponse> =>
    adminHttp.patch<DatabaseHostMutationResponse>(`/api/admin/database-hosts/${id}`, data).then((response) => response.data);

export const deleteDatabaseHost = (id: number): Promise<{ success: boolean; message: string }> =>
    adminHttp.delete<{ success: boolean; message: string }>(`/api/admin/database-hosts/${id}`).then((response) => response.data);
