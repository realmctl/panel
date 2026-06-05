import http from '@/api/http';

export interface ScheduleAction {
    identifier: string;
    label: string;
    description: string;
}

export default async (uuid: string): Promise<ScheduleAction[]> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/schedules/actions`);

    return data.data || [];
};
