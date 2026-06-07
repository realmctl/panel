import React from 'react';
import { Settings, Variable, FileCode } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';
import TabNav, { TabItem } from '@/components/admin-preview/TabNav';

export default () => {
    const { id } = useParams<{ id: string }>();
    const base = `${adminPreviewBasePath}/nests/eggs/${id}`;

    const items: TabItem[] = [
        { id: 'config', label: 'Configuration', icon: Settings, to: base, exact: true },
        { id: 'variables', label: 'Variables', icon: Variable, to: `${base}/variables` },
        { id: 'scripts', label: 'Install Script', icon: FileCode, to: `${base}/scripts` },
    ];

    return <TabNav items={items} />;
};
