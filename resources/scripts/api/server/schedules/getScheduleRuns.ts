import http from '@/api/http';
import { getPaginationSet, PaginatedResult } from '@/api/http';

export interface ScheduleRunTask {
    id: number;
    taskId: number | null;
    sequenceId: number;
    action: string;
    payload: string | null;
    status: string;
    startedAt: Date | null;
    completedAt: Date | null;
    errorMessage: string | null;
}

export interface ScheduleRun {
    id: number;
    status: string;
    trigger: string;
    startedAt: Date | null;
    completedAt: Date | null;
    errorMessage: string | null;
    createdAt: Date;
    tasks: ScheduleRunTask[];
}

const rawDataToRunTask = (data: any): ScheduleRunTask => ({
    id: data.id,
    taskId: data.task_id,
    sequenceId: data.sequence_id,
    action: data.action,
    payload: data.payload,
    status: data.status,
    startedAt: data.started_at ? new Date(data.started_at) : null,
    completedAt: data.completed_at ? new Date(data.completed_at) : null,
    errorMessage: data.error_message,
});

const rawDataToRun = (data: any): ScheduleRun => ({
    id: data.id,
    status: data.status,
    trigger: data.trigger,
    startedAt: data.started_at ? new Date(data.started_at) : null,
    completedAt: data.completed_at ? new Date(data.completed_at) : null,
    errorMessage: data.error_message,
    createdAt: new Date(data.created_at),
    tasks: (data.relationships?.tasks?.data || []).map((row: any) => rawDataToRunTask(row.attributes)),
});

export default async (uuid: string, scheduleId: number, page = 1): Promise<PaginatedResult<ScheduleRun>> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/schedules/${scheduleId}/runs`, {
        params: { page, include: ['tasks'] },
    });

    return {
        items: (data.data || []).map((row: any) => rawDataToRun(row.attributes)),
        pagination: getPaginationSet(data.meta?.pagination),
    };
};
