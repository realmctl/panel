import { adminHttp } from '@/api/admin/http';

export interface MountSummary {
    id: number;
    name: string;
    source: string;
    target: string;
    eggs_count: number;
    nodes_count: number;
    servers_count: number;
}

export interface MountEgg {
    id: number;
    name: string;
}

export interface MountNode {
    id: number;
    name: string;
    fqdn: string;
}

export interface MountDetail {
    id: number;
    uuid: string;
    name: string;
    description: string | null;
    source: string;
    target: string;
    read_only: boolean;
    user_mountable: boolean;
}

export interface MountNestOption {
    id: number;
    name: string;
    eggs: MountEgg[];
}

export interface MountLocationOption {
    id: number;
    short: string;
    long: string | null;
    nodes: { id: number; name: string }[];
}

export interface MountShowResponse {
    mount: MountDetail;
    eggs: MountEgg[];
    nodes: MountNode[];
    available_eggs: MountNestOption[];
    available_nodes: MountLocationOption[];
}

export interface MountStorePayload {
    name: string;
    description?: string;
    source: string;
    target: string;
    read_only: boolean | number;
    user_mountable: boolean | number;
}

export const getMounts = () =>
    adminHttp.get<{ mounts: MountSummary[] }>('/api/admin/mounts').then((r) => r.data);

export const getMount = (id: number) =>
    adminHttp.get<MountShowResponse>(`/api/admin/mounts/${id}`).then((r) => r.data);

export const createMount = (payload: MountStorePayload) =>
    adminHttp.post('/api/admin/mounts', payload).then((r) => r.data);

export const updateMount = (id: number, payload: MountStorePayload) =>
    adminHttp.patch(`/api/admin/mounts/${id}`, payload).then((r) => r.data);

export const deleteMount = (id: number) => adminHttp.delete(`/api/admin/mounts/${id}`);

export const attachMountEggs = (id: number, eggs: number[]) =>
    adminHttp.post(`/api/admin/mounts/${id}/eggs`, { eggs }).then((r) => r.data);

export const attachMountNodes = (id: number, nodes: number[]) =>
    adminHttp.post(`/api/admin/mounts/${id}/nodes`, { nodes }).then((r) => r.data);

export const detachMountEgg = (mountId: number, eggId: number) =>
    adminHttp.delete(`/api/admin/mounts/${mountId}/eggs/${eggId}`);

export const detachMountNode = (mountId: number, nodeId: number) =>
    adminHttp.delete(`/api/admin/mounts/${mountId}/nodes/${nodeId}`);
