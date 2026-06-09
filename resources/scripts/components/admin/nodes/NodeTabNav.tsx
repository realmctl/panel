import React from 'react';
import { useParams } from 'react-router-dom';
import { nodeTabs } from '@/components/admin/nodes/nodeTabs';
import { adminBasePath } from '@/routers/adminRoutes';
import TabNav, { TabItem } from '@/components/admin/TabNav';

export default () => {
    const { id } = useParams<{ id: string }>();

    const items: TabItem[] = nodeTabs.map((tab) => ({
        id: tab.id,
        label: tab.label,
        to: `${adminBasePath}/nodes/${id}${tab.path}`.replace('//', '/'),
        exact: tab.path === '',
    }));

    return <TabNav items={items} />;
};
