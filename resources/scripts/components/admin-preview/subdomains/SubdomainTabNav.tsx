import React from 'react';
import { Globe, LayoutTemplate } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';
import { cn } from '@/lib/utils';

const base = `${adminPreviewBasePath}/subdomains`;

const tabs = [
    { id: 'domains', label: 'Domains', icon: Globe, path: base },
    { id: 'records', label: 'Record Templates', icon: LayoutTemplate, path: `${base}/records` },
] as const;

const isDomainsActive = (pathname: string) => {
    if (pathname === base || pathname === `${base}/`) {
        return true;
    }

    if (pathname.startsWith(`${base}/records`)) {
        return false;
    }

    return pathname.startsWith(`${base}/`);
};

export default () => {
    const { pathname } = useLocation();
    const recordsActive = pathname.startsWith(`${base}/records`);
    const domainsActive = isDomainsActive(pathname);

    return (
        <div className="mb-6 flex flex-wrap gap-1 border-b border-border pb-1">
            {tabs.map((tab) => {
                const active = tab.id === 'records' ? recordsActive : domainsActive;

                return (
                    <NavLink
                        key={tab.id}
                        to={tab.path}
                        exact={tab.id === 'domains'}
                        className={cn(
                            'inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm no-underline transition-colors',
                            active
                                ? 'bg-muted text-primary'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                    </NavLink>
                );
            })}
        </div>
    );
};
