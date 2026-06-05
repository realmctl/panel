import http from '@/api/http';
import { encodePathSegments } from '@/helpers';

export default (server: string, file: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        http.get(`/api/client/servers/${server}/files/contents`, {
            params: { file: encodePathSegments(file) },
            transformResponse: (res) => res,
            responseType: 'text',
        })
            .then(({ data }) => resolve(data))
            .catch(reject);
    });
};
