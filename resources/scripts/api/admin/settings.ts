import { adminHttp } from '@/api/admin/http';

export interface GeneralSettings {
    'app:name': string;
    'pterodactyl:auth:2fa_required': number;
    'app:locale': string;
    'pterodactyl:auth:registration_enabled': 'true' | 'false';
}

export interface AdminSettingsResponse {
    general: GeneralSettings;
    languages: Record<string, string>;
}

export const getAdminSettings = (): Promise<AdminSettingsResponse> =>
    adminHttp.get<AdminSettingsResponse>('/api/admin/settings').then((response) => response.data);

export const updateGeneralSettings = (data: GeneralSettings): Promise<{ success: boolean; message: string }> =>
    adminHttp.patch<{ success: boolean; message: string }>('/api/admin/settings/general', data).then((r) => r.data);
