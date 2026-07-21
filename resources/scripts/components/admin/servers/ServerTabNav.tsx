import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useParams } from 'react-router-dom';
import useSWR from 'swr';
import { getServer } from '@/api/admin/servers';
import { serverTabs } from '@/components/admin/servers/serverTabs';
import { adminBasePath } from '@/routers/adminRoutes';
import TabNav, { TabItem } from '@/components/admin/TabNav';
import { cn } from '@/lib/utils';

export default () => {
    const { id } = useParams<{ id: string }>();
    const serverId = Number(id);
    const { data } = useSWR(Number.isFinite(serverId) ? `admin-server-${serverId}` : null, () => getServer(serverId));

    const items: TabItem[] = serverTabs.map((tab) => ({
        id: tab.id,
        label: tab.label,
        to: `${adminBasePath}/servers/${id}${tab.path}`.replace('//', '/'),
        exact: tab.path === '',
        destructive: tab.destructive,
        hidden: tab.requiresInstalled ? !data?.server.is_installed : false,
    }));

    return (
        <TabNav items={items}>
            {data?.server.uuid_short && (
                <a
                    href={`/instance/${data.server.uuid_short}`}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm no-underline transition-colors',
                        'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open
                </a>
            )}
        </TabNav>
    );
};
