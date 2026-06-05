import http from '@/api/http';

export default async (uuid: string, ids: number[], isActive: boolean): Promise<void> => {
    await http.post(`/api/client/servers/${uuid}/schedules/bulk`, {
        ids,
        is_active: isActive,
    });
};
