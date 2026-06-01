import http from '@/api/http';

export interface ServerGroup {
    uuid: string;
    name: string;
    color: string;
    sortOrder: number;
    serverUuids: string[];
    createdAt: Date;
    updatedAt: Date;
}

const transform = (data: Record<string, any>): ServerGroup => ({
    uuid: data.uuid,
    name: data.name,
    color: data.color,
    sortOrder: data.sort_order,
    serverUuids: data.server_uuids ?? [],
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
});

export const getServerGroups = (): Promise<ServerGroup[]> =>
    http.get('/api/client/server-groups').then(({ data }) =>
        (data.data as any[]).map((item) => transform(item.attributes))
    );

export const createServerGroup = (name: string, color: string): Promise<ServerGroup> =>
    http.post('/api/client/server-groups', { name, color }).then(({ data }) =>
        transform(data.attributes)
    );

export const updateServerGroup = (
    uuid: string,
    payload: Partial<{ name: string; color: string; sort_order: number }>
): Promise<ServerGroup> =>
    http.patch(`/api/client/server-groups/${uuid}`, payload).then(({ data }) =>
        transform(data.attributes)
    );

export const syncGroupServers = (uuid: string, serverUuids: string[]): Promise<ServerGroup> =>
    http.put(`/api/client/server-groups/${uuid}/servers`, { server_uuids: serverUuids }).then(({ data }) =>
        transform(data.attributes)
    );

export const deleteServerGroup = (uuid: string): Promise<void> =>
    http.delete(`/api/client/server-groups/${uuid}`).then(() => undefined);
