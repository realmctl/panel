export interface ServerTab {
    id: string;
    label: string;
    path: string;
    requiresInstalled?: boolean;
    destructive?: boolean;
}

export const serverTabs: ServerTab[] = [
    {
        id: 'about',
        label: 'About',
        path: '',
    },
    {
        id: 'details',
        label: 'Details',
        path: '/details',
        requiresInstalled: true,
    },
    {
        id: 'build',
        label: 'Build',
        path: '/build',
        requiresInstalled: true,
    },
    {
        id: 'startup',
        label: 'Startup',
        path: '/startup',
        requiresInstalled: true,
    },
    {
        id: 'database',
        label: 'Database',
        path: '/database',
        requiresInstalled: true,
    },
    {
        id: 'mounts',
        label: 'Mounts',
        path: '/mounts',
        requiresInstalled: true,
    },
    {
        id: 'manage',
        label: 'Manage',
        path: '/manage',
    },
    {
        id: 'delete',
        label: 'Delete',
        path: '/delete',
        destructive: true,
    },
];
