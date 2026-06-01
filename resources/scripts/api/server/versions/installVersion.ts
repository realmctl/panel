import http from '@/api/http';

export interface InstallResponse {
    success: boolean;
    filename?: string;
    version?: string;
    error?: string;
}

export default async (uuid: string, type: string, version: string): Promise<InstallResponse> => {
    const { data } = await http.post(`/api/client/servers/${uuid}/versions/install`, {
        type,
        version,
    });

    return data;
};
