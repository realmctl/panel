import http from '@/api/http';

export default (uuid: string, subdomainId: number) => {
    return http.delete(`/api/client/servers/${uuid}/network/subdomains/${subdomainId}`);
};
