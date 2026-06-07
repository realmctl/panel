import React from 'react';
import { useParams } from 'react-router-dom';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';
import TabNav, { TabItem } from '@/components/admin-preview/TabNav';

export default () => {
    const { id } = useParams<{ id: string }>();
    const base = `${adminPreviewBasePath}/nests/eggs/${id}`;

    const items: TabItem[] = [
        { id: 'config', label: 'Configuration', to: base, exact: true },
        { id: 'variables', label: 'Variables', to: `${base}/variables` },
        { id: 'scripts', label: 'Install script', to: `${base}/scripts` },
    ];

    return <TabNav items={items} />;
};
