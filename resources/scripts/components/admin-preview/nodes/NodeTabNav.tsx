import React from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { nodeTabs } from '@/components/admin-preview/nodes/nodeTabs';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';
import { cn } from '@/lib/utils';

export default () => {
    const { id } = useParams<{ id: string }>();
    const nodeId = Number(id);

    return (
        <div className="mb-6 flex flex-wrap gap-1 border-b border-border pb-1">
            {nodeTabs.map((tab) => {
                if (tab.legacyPath) {
                    return (
                        <a
                            key={tab.id}
                            href={tab.legacyPath(nodeId)}
                            className={cn(
                                'rounded-md px-3 py-2 text-sm no-underline transition-colors',
                                'text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                        >
                            {tab.label}
                        </a>
                    );
                }

                const to = `${adminPreviewBasePath}/nodes/${id}${tab.path}`.replace('//', '/');

                return (
                    <NavLink
                        key={tab.id}
                        to={to}
                        exact={tab.path === ''}
                        className={cn(
                            'rounded-md px-3 py-2 text-sm no-underline transition-colors',
                            'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                        activeClassName="bg-muted text-primary"
                    >
                        {tab.label}
                    </NavLink>
                );
            })}
        </div>
    );
};
