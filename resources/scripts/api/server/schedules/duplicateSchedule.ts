import { rawDataToServerSchedule, Schedule } from '@/api/server/schedules/getServerSchedules';
import http from '@/api/http';

export default async (uuid: string, scheduleId: number): Promise<Schedule> => {
    const { data } = await http.post(`/api/client/servers/${uuid}/schedules/${scheduleId}/duplicate`);

    return rawDataToServerSchedule(data.attributes);
};
