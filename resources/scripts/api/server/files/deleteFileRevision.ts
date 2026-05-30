import http from '@/api/http';

export default async (uuid: string, revisionId: string): Promise<void> => {
    await http.delete(`/api/client/servers/${uuid}/files/revisions/${revisionId}`);
};
