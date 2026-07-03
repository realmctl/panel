import http from '@/api/http';

export interface PermissionTemplate {
    uuid: string;
    name: string;
    permissions: string[];
    createdAt: Date;
    updatedAt: Date;
}

const transform = (data: Record<string, any>): PermissionTemplate => ({
    uuid: data.uuid,
    name: data.name,
    permissions: data.permissions ?? [],
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
});

export const getPermissionTemplates = (): Promise<PermissionTemplate[]> =>
    http.get('/api/client/permission-templates').then(({ data }) =>
        (data.data as any[]).map((item) => transform(item.attributes))
    );

export const createPermissionTemplate = (name: string, permissions: string[]): Promise<PermissionTemplate> =>
    http.post('/api/client/permission-templates', { name, permissions }).then(({ data }) =>
        transform(data.attributes)
    );

export const updatePermissionTemplate = (
    uuid: string,
    payload: Partial<{ name: string; permissions: string[] }>
): Promise<PermissionTemplate> =>
    http.patch(`/api/client/permission-templates/${uuid}`, payload).then(({ data }) =>
        transform(data.attributes)
    );

export const deletePermissionTemplate = (uuid: string): Promise<void> =>
    http.delete(`/api/client/permission-templates/${uuid}`).then(() => undefined);
