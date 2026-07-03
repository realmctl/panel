import { adminHttp } from '@/api/admin/http';

export interface BackupDestination {
    id: number;
    name: string;
    adapter: string;
    bucket: string | null;
    region: string | null;
    access_key: string | null;
    endpoint: string | null;
    use_path_style_endpoint: boolean;
    storage_class: string | null;
    locations_count: number;
}

export interface BackupDestinationListResponse {
    backup_destinations: BackupDestination[];
}

export interface BackupDestinationShowResponse {
    backup_destination: BackupDestination;
}

export interface BackupDestinationFormData {
    name: string;
    adapter: string;
    bucket: string;
    region: string;
    access_key: string;
    secret_key: string;
    endpoint: string;
    use_path_style_endpoint: boolean;
    storage_class: string;
}

export interface BackupDestinationMutationResponse {
    success: boolean;
    message: string;
    backup_destination: BackupDestination;
}

export const getBackupDestinations = (): Promise<BackupDestinationListResponse> =>
    adminHttp.get<BackupDestinationListResponse>('/api/admin/backup-destinations').then((response) => response.data);

export const getBackupDestination = (id: number): Promise<BackupDestinationShowResponse> =>
    adminHttp
        .get<BackupDestinationShowResponse>(`/api/admin/backup-destinations/${id}`)
        .then((response) => response.data);

export const createBackupDestination = (
    data: Partial<BackupDestinationFormData>
): Promise<BackupDestinationMutationResponse> =>
    adminHttp
        .post<BackupDestinationMutationResponse>('/api/admin/backup-destinations', data)
        .then((response) => response.data);

export const updateBackupDestination = (
    id: number,
    data: Partial<BackupDestinationFormData>
): Promise<BackupDestinationMutationResponse> =>
    adminHttp
        .patch<BackupDestinationMutationResponse>(`/api/admin/backup-destinations/${id}`, data)
        .then((response) => response.data);

export const deleteBackupDestination = (id: number): Promise<{ success: boolean; message: string }> =>
    adminHttp
        .delete<{ success: boolean; message: string }>(`/api/admin/backup-destinations/${id}`)
        .then((response) => response.data);
