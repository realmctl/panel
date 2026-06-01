import http from '@/api/http';

export default (uuid: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        http.delete(`/api/client/servers/${uuid}/backups`)
            .then(() => resolve())
            .catch(reject);
    });
};
