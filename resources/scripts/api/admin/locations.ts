import { adminHttp } from '@/api/admin/http';

export interface LocationSummary {
    id: number;
    short: string;
    long: string | null;
    nodes_count: number;
    servers_count: number;
}

export interface LocationNode {
    id: number;
    name: string;
    fqdn: string;
    servers_count: number;
}

export interface LocationDetail {
    id: number;
    short: string;
    long: string | null;
    backup_destination_id: number | null;
}

export interface LocationListResponse {
    locations: LocationSummary[];
}

export interface LocationShowResponse {
    location: LocationDetail;
    nodes: LocationNode[];
}

export interface LocationFormData {
    short: string;
    long: string;
    backup_destination_id?: number | null;
}

export interface LocationMutationResponse {
    success: boolean;
    message: string;
    location: LocationDetail;
}

export const getLocations = (): Promise<LocationListResponse> =>
    adminHttp.get<LocationListResponse>('/api/admin/locations').then((response) => response.data);

export const getLocation = (id: number): Promise<LocationShowResponse> =>
    adminHttp.get<LocationShowResponse>(`/api/admin/locations/${id}`).then((response) => response.data);

export const createLocation = (data: LocationFormData): Promise<LocationMutationResponse> =>
    adminHttp.post<LocationMutationResponse>('/api/admin/locations', data).then((response) => response.data);

export const updateLocation = (id: number, data: LocationFormData): Promise<LocationMutationResponse> =>
    adminHttp.patch<LocationMutationResponse>(`/api/admin/locations/${id}`, data).then((response) => response.data);

export const deleteLocation = (id: number): Promise<{ success: boolean; message: string }> =>
    adminHttp.delete<{ success: boolean; message: string }>(`/api/admin/locations/${id}`).then((response) => response.data);
