import { adminHttp } from '@/api/admin/http';

export interface GeneralSettings {
    'app:name': string;
    'realm:auth:2fa_required': number;
    'app:locale': string;
    'realm:auth:registration_enabled': 'true' | 'false';
}

export interface AdminSettingsResponse {
    general: GeneralSettings;
    languages: Record<string, string>;
}

export interface MailSettings {
    'mail:default': string;
    'mail:from:address': string;
    'mail:from:name': string;
    'mail:mailers:smtp:host': string;
    'mail:mailers:smtp:port': number | string;
    'mail:mailers:smtp:encryption': string;
    'mail:mailers:smtp:username': string;
    'mail:mailers:smtp:password'?: string;
    'services:mailgun:domain': string;
    'services:mailgun:secret'?: string;
    'services:mailgun:endpoint': string;
    'services:postmark:token'?: string;
    'services:resend:key'?: string;
}

export interface MailSettingsResponse {
    disabled: boolean;
    driver: string;
    providers: string[];
    settings: MailSettings;
}

export interface SecuritySettings {
    'captcha:provider': 'recaptcha' | 'turnstile' | 'none';
    'captcha:recaptcha:website_key': string;
    'captcha:recaptcha:secret_key': string;
    'captcha:turnstile:website_key': string;
    'captcha:turnstile:secret_key': string;
    'realm:guzzle:connect_timeout': number;
    'realm:guzzle:timeout': number;
}

export interface SecuritySettingsResponse {
    showRecaptchaWarning: boolean;
    settings: SecuritySettings;
}

export interface OAuthProviderSettings {
    enabled: 'true' | 'false';
    client_id: string;
    client_secret: string;
}

export interface OAuthSettings {
    'oauth:google:enabled': 'true' | 'false';
    'oauth:google:client_id': string;
    'oauth:google:client_secret': string;
    'oauth:discord:enabled': 'true' | 'false';
    'oauth:discord:client_id': string;
    'oauth:discord:client_secret': string;
    'oauth:github:enabled': 'true' | 'false';
    'oauth:github:client_id': string;
    'oauth:github:client_secret': string;
}

export interface OAuthSettingsResponse {
    settings: OAuthSettings;
    callbackUrls: Record<'google' | 'discord' | 'github', string>;
}

export interface EggCategoryDefinition {
    label: string;
    description?: string;
    icon?: string;
    features?: string[];
}

export interface NestWithEggs {
    id: number;
    name: string;
    eggs: { id: number; name: string }[];
}

export interface MappingsSettingsResponse {
    categories: Record<string, EggCategoryDefinition>;
    mappings: Record<string, number[]>;
    nests: NestWithEggs[];
}

export interface AdvancedSettings {
    'realm:client_features:allocations:enabled': 'true' | 'false';
    'realm:client_features:allocations:range_start': number | string | null;
    'realm:client_features:allocations:range_end': number | string | null;
}

export interface AdvancedSettingsResponse {
    settings: AdvancedSettings;
}

export interface SettingsUpdateResponse {
    success: boolean;
    message: string;
}

export const getAdminSettings = (): Promise<AdminSettingsResponse> =>
    adminHttp.get<AdminSettingsResponse>('/api/admin/settings').then((response) => response.data);

export const updateGeneralSettings = (data: GeneralSettings): Promise<SettingsUpdateResponse> =>
    adminHttp.patch<SettingsUpdateResponse>('/api/admin/settings/general', data).then((r) => r.data);

export const getMailSettings = (): Promise<MailSettingsResponse> =>
    adminHttp.get<MailSettingsResponse>('/api/admin/settings/mail').then((response) => response.data);

export const updateMailSettings = (data: Partial<MailSettings>): Promise<SettingsUpdateResponse> =>
    adminHttp.patch<SettingsUpdateResponse>('/api/admin/settings/mail', data).then((r) => r.data);

export const testMailSettings = (): Promise<SettingsUpdateResponse> =>
    adminHttp.post<SettingsUpdateResponse>('/api/admin/settings/mail/test').then((r) => r.data);

export const getSecuritySettings = (): Promise<SecuritySettingsResponse> =>
    adminHttp.get<SecuritySettingsResponse>('/api/admin/settings/security').then((response) => response.data);

export const updateSecuritySettings = (data: SecuritySettings): Promise<SettingsUpdateResponse> =>
    adminHttp.patch<SettingsUpdateResponse>('/api/admin/settings/security', data).then((r) => r.data);

export const getOAuthSettings = (): Promise<OAuthSettingsResponse> =>
    adminHttp.get<OAuthSettingsResponse>('/api/admin/settings/oauth').then((response) => response.data);

export const updateOAuthSettings = (data: OAuthSettings): Promise<SettingsUpdateResponse> =>
    adminHttp.patch<SettingsUpdateResponse>('/api/admin/settings/oauth', data).then((r) => r.data);

export const getMappingsSettings = (): Promise<MappingsSettingsResponse> =>
    adminHttp.get<MappingsSettingsResponse>('/api/admin/settings/mappings').then((response) => response.data);

export const updateMappingsSettings = (mappings: Record<string, number[]>): Promise<SettingsUpdateResponse> =>
    adminHttp.patch<SettingsUpdateResponse>('/api/admin/settings/mappings', { mappings }).then((r) => r.data);

export const getAdvancedSettings = (): Promise<AdvancedSettingsResponse> =>
    adminHttp.get<AdvancedSettingsResponse>('/api/admin/settings/advanced').then((response) => response.data);

export const updateAdvancedSettings = (data: AdvancedSettings): Promise<SettingsUpdateResponse> =>
    adminHttp.patch<SettingsUpdateResponse>('/api/admin/settings/advanced', data).then((r) => r.data);
