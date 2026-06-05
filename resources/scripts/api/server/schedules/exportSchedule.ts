import http from '@/api/http';
import { AutomationTemplate } from '@/components/server/schedules/automationTemplates';

export default async (uuid: string, scheduleId: number): Promise<AutomationTemplate> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/schedules/${scheduleId}/export`);

    return data;
};
