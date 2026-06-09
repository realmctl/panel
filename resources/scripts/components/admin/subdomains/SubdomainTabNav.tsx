import React from 'react';
import { adminBasePath } from '@/routers/adminRoutes';
import TabNav, { TabItem } from '@/components/admin/TabNav';

const base = `${adminBasePath}/subdomains`;

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
