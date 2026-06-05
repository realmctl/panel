import http from '@/api/http';
import { encodePathSegments } from '@/helpers';

export default async (uuid: string, file: string, content: string): Promise<void> => {
    await http.post(`/api/client/servers/${uuid}/files/write`, content, {
        params: { file: encodePathSegments(file) },
        headers: {
            'Content-Type': 'text/plain',
        },
    });
};
