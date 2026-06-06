import http from '@/api/http';
import { rawDataToFileObject } from '@/api/transformers';
import { FileObject } from '@/api/server/files/loadDirectory';

export default async (uuid: string, file: string, directory = '/'): Promise<FileObject[]> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/files/list-archive`, {
        params: { file, directory },
    });

    return (data.data || []).map(rawDataToFileObject);
};
