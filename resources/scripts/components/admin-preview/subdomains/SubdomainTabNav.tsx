import React from 'react';
import { Globe, LayoutTemplate } from 'lucide-react';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';
import TabNav, { TabItem } from '@/components/admin-preview/TabNav';

const base = `${adminPreviewBasePath}/subdomains`;

const items: TabItem[] = [
    {
        id: 'domains',
        label: 'Domains',
        icon: Globe,
        to: base,
        isActive: (pathname) => !pathname.startsWith(`${base}/records`),
    },
    {
        id: 'records',
        label: 'Record Templates',
        icon: LayoutTemplate,
        to: `${base}/records`,
    },
];

export default () => <TabNav items={items} />;
