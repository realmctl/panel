export interface PermissionPreset {
    id: string;
    label: string;
    description: string;
    permissions: string[];
}

export const PERMISSION_PRESETS: PermissionPreset[] = [
    {
        id: 'view',
        label: 'View only',
        description: 'Console and read-only access',
        permissions: [
            'websocket.connect',
            'control.console',
            'file.read',
            'file.read-content',
            'backup.read',
            'schedule.read',
            'user.read',
            'database.read',
            'allocation.read',
            'startup.read',
            'activity.read',
        ],
    },
    {
        id: 'operator',
        label: 'Operator',
        description: 'Console, power controls, and file access',
        permissions: [
            'websocket.connect',
            'control.console',
            'control.start',
            'control.stop',
            'control.restart',
            'file.read',
            'file.read-content',
            'file.create',
            'file.update',
            'file.delete',
            'file.archive',
            'backup.read',
            'backup.create',
            'schedule.read',
            'user.read',
            'activity.read',
        ],
    },
    {
        id: 'manager',
        label: 'Manager',
        description: 'Full server management without user or settings control',
        permissions: [
            'websocket.connect',
            'control.console',
            'control.start',
            'control.stop',
            'control.restart',
            'file.read',
            'file.read-content',
            'file.create',
            'file.update',
            'file.delete',
            'file.archive',
            'file.sftp',
            'file.revision-read',
            'file.revision-restore',
            'file.revision-delete',
            'backup.read',
            'backup.create',
            'backup.delete',
            'backup.download',
            'backup.restore',
            'schedule.read',
            'schedule.create',
            'schedule.update',
            'schedule.delete',
            'database.read',
            'database.create',
            'database.update',
            'database.delete',
            'database.view_password',
            'allocation.read',
            'allocation.create',
            'allocation.update',
            'allocation.delete',
            'startup.read',
            'startup.update',
            'startup.docker-image',
            'activity.read',
            'user.read',
        ],
    },
];

export const resolvePresetPermissions = (presetId: string, editable: string[]): string[] => {
    if (presetId === 'full') {
        return [...editable];
    }

    const preset = PERMISSION_PRESETS.find((p) => p.id === presetId);
    if (!preset) {
        return [];
    }

    return preset.permissions.filter((p) => editable.includes(p));
};
