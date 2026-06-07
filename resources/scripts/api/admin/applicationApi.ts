import { adminHttp } from '@/api/admin/http';

export interface ApplicationApiKey {
    identifier: string;
    display_key: string;
    memo: string | null;
    last_used_at: string | null;
    created_at: string | null;
    user: {
        id: number;
        username: string;
    } | null;
}

export interface ApplicationApiPermissions {
    read: number;
    readWrite: number;
    none: number;
}

export interface ApplicationApiCreateMeta {
    resources: string[];
    permissions: ApplicationApiPermissions;
}

export interface ApplicationApiListResponse {
    keys: ApplicationApiKey[];
}

export interface ApplicationApiStoreResponse {
    success: boolean;
    message: string;
    key: ApplicationApiKey;
    secret_token: string;
}

export const getApplicationApiKeys = (): Promise<ApplicationApiListResponse> =>
    adminHttp.get<ApplicationApiListResponse>('/api/admin/application-api').then((response) => response.data);

export const getApplicationApiCreateMeta = (): Promise<ApplicationApiCreateMeta> =>
    adminHttp.get<ApplicationApiCreateMeta>('/api/admin/application-api/create').then((response) => response.data);

export const createApplicationApiKey = (
    memo: string,
    permissions: Record<string, number>
): Promise<ApplicationApiStoreResponse> =>
    adminHttp
        .post<ApplicationApiStoreResponse>('/api/admin/application-api', {
            memo,
            ...permissions,
        })
        .then((response) => response.data);

export const revokeApplicationApiKey = (identifier: string): Promise<{ success: boolean }> =>
    adminHttp.delete<{ success: boolean }>(`/api/admin/application-api/${identifier}`).then((response) => response.data);

export const formatResourceLabel = (resource: string): string =>
    resource
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
