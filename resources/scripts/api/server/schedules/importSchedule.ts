import { rawDataToServerSchedule, Schedule } from '@/api/server/schedules/getServerSchedules';
import http from '@/api/http';
import { AutomationTemplate } from '@/components/server/schedules/automationTemplates';

export default async (uuid: string, template: AutomationTemplate): Promise<Schedule> => {
    const { data } = await http.post(`/api/client/servers/${uuid}/schedules/import`, { template });

    return rawDataToServerSchedule(data.attributes);
};
