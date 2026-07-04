import { adminHttp } from '@/api/admin/http';

export interface AiProviderTypeConfig {
    title: string;
    default_model: string;
    custom_base_url: boolean;
}

export type AiProviderTypes = Record<string, AiProviderTypeConfig>;

export interface AiProviderDetail {
    id: number;
    name: string;
    type: string;
    display_type: string;
    base_url: string | null;
    model: string | null;
}

export interface AiProviderCurrentResponse {
    provider: AiProviderDetail | null;
    providers: AiProviderTypes;
}

export interface AiProviderSavePayload {
    type: string;
    api_key?: string;
    base_url?: string;
    model?: string;
}

export interface AiProviderTestResponse {
    success: boolean;
    reply?: string;
    error?: string;
}

export const getCurrentAiProvider = (): Promise<AiProviderCurrentResponse> =>
    adminHttp.get<AiProviderCurrentResponse>('/api/admin/ai-provider').then((response) => response.data);

export const saveAiProvider = (payload: AiProviderSavePayload) =>
    adminHttp.patch('/api/admin/ai-provider', payload).then((response: any) => response.data);

export const removeAiProvider = () => adminHttp.delete('/api/admin/ai-provider');

export const testAiProvider = (): Promise<AiProviderTestResponse> =>
    adminHttp.post<AiProviderTestResponse>('/api/admin/ai-provider/test').then((response) => response.data);
