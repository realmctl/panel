import http from '@/api/http';

export interface FileRevision {
    uuid: string;
    filePath: string;
    hash: string | null;
    size: number;
    action: 'created' | 'edited' | 'uploaded' | 'deleted' | 'restored';
    userId: number | null;
    createdAt: string;
}

export default async (uuid: string, file: string): Promise<FileRevision[]> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/files/revisions`, {
        params: { file },
    });

    return (data.data || []).map((item: any) => ({
        uuid: item.attributes.uuid,
        filePath: item.attributes.file_path,
        hash: item.attributes.hash,
        size: item.attributes.size,
        action: item.attributes.action,
        userId: item.attributes.user_id,
        createdAt: item.attributes.created_at,
    }));
};
