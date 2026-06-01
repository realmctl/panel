import http from '@/api/http';

export interface VersionsResponse {
    type: string;
    versions: string[];
}

export default async (uuid: string, type: string): Promise<VersionsResponse> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/versions`, {
        params: { type },
    });

    return data;
};
