import http from '@/api/http';
import { encodePathSegments } from '@/helpers';

export default (uuid: string, file: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        http.get(`/api/client/servers/${uuid}/files/download`, { params: { file: encodePathSegments(file) } })
            .then(({ data }) => resolve(data.attributes.url))
            .catch(reject);
    });
};
