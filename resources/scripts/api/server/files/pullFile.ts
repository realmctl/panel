import http from '@/api/http';

export default (uuid: string, url: string, directory: string, filename?: string): Promise<void> => {
    return http.post(`/api/client/servers/${uuid}/files/pull`, {
        url,
        directory,
        filename: filename ?? null,
        use_header: false,
        foreground: false,
    }).then(() => undefined);
};
