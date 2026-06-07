import React from 'react';
import { useParams } from 'react-router-dom';
import { nodeTabs } from '@/components/admin-preview/nodes/nodeTabs';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';
import TabNav, { TabItem } from '@/components/admin-preview/TabNav';

export default () => {
    const { id } = useParams<{ id: string }>();
    const nodeId = Number(id);

    const items: TabItem[] = nodeTabs.map((tab) => {
        if (tab.legacyPath) {
            return { id: tab.id, label: tab.label, to: tab.legacyPath(nodeId), external: true };
        }

        return {
            id: tab.id,
            label: tab.label,
            to: `${adminPreviewBasePath}/nodes/${id}${tab.path}`.replace('//', '/'),
            exact: tab.path === '',
        };
    });

    return <TabNav items={items} />;
};
