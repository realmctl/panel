import { adminHttp } from '@/api/admin/http';

export interface UserSummary {
    id: number;
    email: string;
    username: string;
    name_first: string;
    name_last: string;
    uuid: string;
    root_admin: boolean;
    use_totp: boolean;
    servers_count: number;
    subuser_of_count: number;
    gravatar_hash: string;
}

export interface UserDetail {
    id: number;
    email: string;
    username: string;
    name_first: string;
    name_last: string;
    language: string;
    root_admin: boolean;
    use_totp: boolean;
    uuid: string;
    servers_count: number;
    gravatar_hash: string;
}

export interface UserSearchResult {
    id: number;
    email: string;
    username: string;
    name_first: string;
    name_last: string;
}

export interface PaginationMeta {
    current_page: number;
    last_page: number;
    total: number;
}

export interface UserListParams {
    page?: number;
    filter?: {
        email?: string;
        username?: string;
        uuid?: string;
    };
}

export interface UserListResponse {
    users: UserSummary[];
    pagination: PaginationMeta;
}

export interface UserCreateMetaResponse {
    languages: Record<string, string>;
    default_language: string;
}

export interface UserShowResponse {
    user: UserDetail;
    languages: Record<string, string>;
    can_delete: boolean;
}

export interface UserStorePayload {
    email: string;
    username: string;
    name_first: string;
    name_last: string;
    language: string;
    root_admin: boolean | number;
    password?: string;
}

const buildListQuery = (params?: UserListParams): string => {
    const search = new URLSearchParams();

    if (params?.page) {
        search.set('page', String(params.page));
    }

    if (params?.filter?.email) {
        search.set('filter[email]', params.filter.email);
    }

    if (params?.filter?.username) {
        search.set('filter[username]', params.filter.username);
    }

    if (params?.filter?.uuid) {
        search.set('filter[uuid]', params.filter.uuid);
    }

    const query = search.toString();

    return query ? `?${query}` : '';
};

export const getUsers = (params?: UserListParams): Promise<UserListResponse> =>
    adminHttp.get<UserListResponse>(`/api/admin/users${buildListQuery(params)}`).then((response) => response.data);

export const getUserCreateMeta = (): Promise<UserCreateMetaResponse> =>
    adminHttp.get<UserCreateMetaResponse>('/api/admin/users/create').then((response) => response.data);

export const getUser = (id: number): Promise<UserShowResponse> =>
    adminHttp.get<UserShowResponse>(`/api/admin/users/${id}`).then((response) => response.data);

export const createUser = (payload: UserStorePayload) =>
    adminHttp.post('/api/admin/users', payload).then((response) => response.data);

export const updateUser = (id: number, payload: Partial<UserStorePayload>) =>
    adminHttp.patch(`/api/admin/users/${id}`, payload).then((response) => response.data);

export const deleteUser = (id: number) => adminHttp.delete(`/api/admin/users/${id}`);

export const searchUsers = (email: string): Promise<{ users: UserSearchResult[] }> =>
    adminHttp
        .get<{ users: UserSearchResult[] }>(`/api/admin/users/search?filter[email]=${encodeURIComponent(email)}`)
        .then((response) => response.data);
