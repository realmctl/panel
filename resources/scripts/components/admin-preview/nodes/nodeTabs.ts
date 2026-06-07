export interface NodeTab {
    id: string;
    label: string;
    path: string;
    legacyPath?: (nodeId: number) => string;
}

export const nodeTabs: NodeTab[] = [
    {
        id: 'about',
        label: 'About',
        path: '',
    },
    {
        id: 'settings',
        label: 'Settings',
        path: '/settings',
    },
    {
        id: 'configuration',
        label: 'Configuration',
        path: '/configuration',
    },
    {
        id: 'allocation',
        label: 'Allocation',
        path: '/allocation',
    },
    {
        id: 'servers',
        label: 'Servers',
        path: '/servers',
    },
];
