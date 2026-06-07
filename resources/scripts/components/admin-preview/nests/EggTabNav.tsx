import React from 'react';
import { Settings, Variable, FileCode } from 'lucide-react';
import { NavLink, useParams } from 'react-router-dom';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';
import { cn } from '@/lib/utils';

const tabs = [
    { id: 'config', label: 'Configuration', icon: Settings, path: '' },
    { id: 'variables', label: 'Variables', icon: Variable, path: '/variables' },
    { id: 'scripts', label: 'Install Script', icon: FileCode, path: '/scripts' },
] as const;

export default () => {
    const { id } = useParams<{ id: string }>();
    const base = `${adminPreviewBasePath}/nests/eggs/${id}`;

    return (
        <div className="mb-6 flex flex-wrap gap-1 border-b border-border pb-1">
            {tabs.map((tab) => (
                <NavLink
                    key={tab.id}
                    to={`${base}${tab.path}`}
                    exact={tab.path === ''}
                    className={cn(
                        'inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm no-underline transition-colors',
                        'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                    activeClassName="bg-muted text-primary"
                >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                </NavLink>
            ))}
        </div>
    );
};
