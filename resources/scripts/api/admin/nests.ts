import { adminHttp } from '@/api/admin/http';

export interface NestSummary {
    id: number;
    name: string;
    author: string;
    description: string | null;
    eggs_count: number;
    servers_count: number;
}

export interface NestEggSummary {
    id: number;
    name: string;
    description: string | null;
    servers_count: number;
}

export interface NestDetail {
    id: number;
    name: string;
    author: string;
    description: string | null;
    uuid: string;
}

export interface NestShowResponse {
    nest: NestDetail;
    eggs: NestEggSummary[];
}

export interface NestEggOption {
    id: number;
    name: string;
    author: string;
}

export interface NestWithEggsOption {
    id: number;
    name: string;
    author: string;
    eggs: NestEggOption[];
}

export interface EggDetail {
    id: number;
    nest_id: number;
    uuid: string;
    name: string;
    author: string;
    description: string | null;
    background: string | null;
    docker_images: string;
    force_outgoing_ip: boolean;
    startup: string;
    features: string[];
    config_from: number | null;
    config_stop: string | null;
    config_logs: string;
    config_files: string;
    config_startup: string;
}

export interface EggShowResponse {
    egg: EggDetail;
    nest_eggs: NestEggOption[];
}

export interface EggVariable {
    id: number;
    name: string;
    description: string | null;
    env_variable: string;
    default_value: string;
    user_viewable: boolean;
    user_editable: boolean;
    rules: string;
}

export interface EggVariablesResponse {
    egg: { id: number; name: string; nest_id: number };
    variables: EggVariable[];
}

export interface EggScriptResponse {
    egg: {
        id: number;
        name: string;
        nest_id: number;
        script_install: string | null;
        script_container: string | null;
        script_entry: string | null;
        copy_script_from: number | null;
        copy_from: { id: number; name: string } | null;
    };
    copy_from_options: { id: number; name: string }[];
    rely_on_script: { id: number; name: string }[];
}

export interface EggStorePayload {
    nest_id?: number;
    name: string;
    description?: string;
    background?: string;
    docker_images: string;
    force_outgoing_ip?: boolean | number;
    startup: string;
    features?: string[];
    config_from?: number | null;
    config_stop?: string;
    config_logs?: string;
    config_files?: string;
    config_startup?: string;
}

export interface EggVariablePayload {
    name: string;
    description?: string;
    env_variable: string;
    default_value?: string;
    rules: string;
    options?: string[];
}

export interface EggScriptPayload {
    script_install?: string;
    script_container?: string;
    script_entry?: string;
    copy_script_from?: number | null;
}

export const getNests = () =>
    adminHttp.get<{ nests: NestSummary[] }>('/api/admin/nests').then((r) => r.data);

export const getNest = (id: number) =>
    adminHttp.get<NestShowResponse>(`/api/admin/nests/${id}`).then((r) => r.data);

export const createNest = (data: { name: string; description?: string }) =>
    adminHttp.post('/api/admin/nests', data).then((r) => r.data);

export const updateNest = (id: number, data: { name: string; description?: string }) =>
    adminHttp.patch(`/api/admin/nests/${id}`, data).then((r) => r.data);

export const deleteNest = (id: number) => adminHttp.delete(`/api/admin/nests/${id}`);

export const getEggCreateMeta = () =>
    adminHttp.get<{ nests: NestWithEggsOption[] }>('/api/admin/nests/eggs/create').then((r) => r.data);

export const getEgg = (id: number) =>
    adminHttp.get<EggShowResponse>(`/api/admin/nests/eggs/${id}`).then((r) => r.data);

export const createEgg = (payload: EggStorePayload) =>
    adminHttp.post('/api/admin/nests/eggs', payload).then((r) => r.data);

export const updateEgg = (id: number, payload: Partial<EggStorePayload>) =>
    adminHttp.patch(`/api/admin/nests/eggs/${id}`, payload).then((r) => r.data);

export const deleteEgg = (id: number) =>
    adminHttp.delete<{ success: boolean; nest_id: number }>(`/api/admin/nests/eggs/${id}`).then((r) => r.data);

export const importEgg = (file: File, nestId: number) => {
    const form = new FormData();
    form.append('import_file', file);
    form.append('import_to_nest', String(nestId));

    return adminHttp.postForm('/api/admin/nests/eggs/import', form).then((r) => r.data);
};

export const importUpdateEgg = (id: number, file: File) => {
    const form = new FormData();
    form.append('import_file', file);

    return adminHttp.postForm(`/api/admin/nests/eggs/${id}/import`, form).then((r) => r.data);
};

export const getEggExportUrl = (id: number) => `/api/admin/nests/eggs/${id}/export`;

export const getEggVariables = (id: number) =>
    adminHttp.get<EggVariablesResponse>(`/api/admin/nests/eggs/${id}/variables`).then((r) => r.data);

export const createEggVariable = (eggId: number, payload: EggVariablePayload) =>
    adminHttp.post(`/api/admin/nests/eggs/${eggId}/variables`, payload).then((r) => r.data);

export const updateEggVariable = (eggId: number, variableId: number, payload: EggVariablePayload) =>
    adminHttp.patch(`/api/admin/nests/eggs/${eggId}/variables/${variableId}`, payload).then((r) => r.data);

export const deleteEggVariable = (eggId: number, variableId: number) =>
    adminHttp.delete(`/api/admin/nests/eggs/${eggId}/variables/${variableId}`);

export const getEggScripts = (id: number) =>
    adminHttp.get<EggScriptResponse>(`/api/admin/nests/eggs/${id}/scripts`).then((r) => r.data);

export const updateEggScripts = (id: number, payload: EggScriptPayload) =>
    adminHttp.patch(`/api/admin/nests/eggs/${id}/scripts`, payload).then((r) => r.data);
