import React from 'react';
import { ExternalLink } from 'lucide-react';
import { NavLink, useParams } from 'react-router-dom';
import useSWR from 'swr';
import { getServer } from '@/api/admin/servers';
import { serverTabs } from '@/components/admin-preview/servers/serverTabs';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';
import { cn } from '@/lib/utils';

export default () => {
    const { id } = useParams<{ id: string }>();
    const serverId = Number(id);
    const { data } = useSWR(Number.isFinite(serverId) ? `admin-server-${serverId}` : null, () => getServer(serverId));

    const visibleTabs = serverTabs.filter((tab) => !tab.requiresInstalled || data?.server.is_installed);

    return (
        <div className="mb-6 flex flex-wrap items-center gap-1 border-b border-border pb-1">
            {visibleTabs.map((tab) => {
                const to = `${adminPreviewBasePath}/servers/${id}${tab.path}`.replace('//', '/');

                return (
                    <NavLink
                        key={tab.id}
                        to={to}
                        exact={tab.path === ''}
                        className={cn(
                            'rounded-md px-3 py-2 text-sm no-underline transition-colors',
                            tab.destructive
                                ? 'text-destructive hover:bg-destructive/10'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                        activeClassName={tab.destructive ? 'bg-destructive/10 text-destructive' : 'bg-muted text-primary'}
                    >
                        {tab.label}
                    </NavLink>
                );
            })}

            {data?.server.uuid_short && (
                <a
                    href={`/server/${data.server.uuid_short}`}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                        'ml-auto inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm no-underline transition-colors',
                        'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                >
                    <ExternalLink className="h-4 w-4" />
                    Open
                </a>
            )}
        </div>
    );
};
