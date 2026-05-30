import http from '@/api/http';

export default async (uuid: string, revisionId: string): Promise<string> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/files/revisions/${revisionId}`, {
        transformResponse: (res) => res,
        responseType: 'text',
    });

    return data;
};
