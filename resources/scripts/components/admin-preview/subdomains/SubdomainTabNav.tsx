import React from 'react';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';
import TabNav, { TabItem } from '@/components/admin-preview/TabNav';

const base = `${adminPreviewBasePath}/subdomains`;

const items: TabItem[] = [
    {
        id: 'domains',
        label: 'Domains',
        to: base,
        isActive: (pathname) => !pathname.startsWith(`${base}/records`),
    },
    {
        id: 'records',
        label: 'Record templates',
        to: `${base}/records`,
    },
];

export default () => <TabNav items={items} />;
