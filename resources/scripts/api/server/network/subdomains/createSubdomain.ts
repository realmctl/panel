import http from '@/api/http';

export default (uuid: string, record: number, name: string) => {
    return http.post(`/api/client/servers/${uuid}/network/subdomains`, { record, data: name });
};
