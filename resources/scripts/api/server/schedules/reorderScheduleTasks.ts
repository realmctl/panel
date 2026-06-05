import { rawDataToServerTask, Task } from '@/api/server/schedules/getServerSchedules';
import http from '@/api/http';

export default async (uuid: string, scheduleId: number, order: number[]): Promise<Task[]> => {
    const { data } = await http.post(`/api/client/servers/${uuid}/schedules/${scheduleId}/tasks/reorder`, {
        order,
    });

    return (data.data || []).map((row: any) => rawDataToServerTask(row.attributes));
};
