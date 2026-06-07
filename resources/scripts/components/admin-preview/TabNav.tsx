import React from 'react';
import { NavLink } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TabItem {
    id: string;
    label: string;
    to: string;
    icon?: LucideIcon;
    exact?: boolean;
    external?: boolean;
    destructive?: boolean;
    hidden?: boolean;
    isActive?: (pathname: string) => boolean;
}

interface Props {
    items: TabItem[];
    className?: string;
    children?: React.ReactNode;
}

const tabClass = (destructive?: boolean) =>
    cn(
        'flex min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap px-4 py-3 text-sm no-underline transition-colors',
        destructive
            ? 'text-destructive/80 hover:bg-destructive/10 hover:text-destructive'
            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
    );

const activeTabClass = (destructive?: boolean) =>
    cn(
        'font-medium',
        destructive ? 'bg-destructive/10 text-destructive' : 'bg-muted/50 text-foreground'
    );

const renderInner = (item: TabItem) => (
    <>
        {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
        <span className="truncate">{item.label}</span>
    </>
);

export default ({ items, className, children }: Props) => {
    const visibleItems = items.filter((item) => !item.hidden);

    return (
        <div className={cn('mb-6 overflow-hidden rounded-md border border-border bg-card', className)}>
            <div className="flex flex-col sm:flex-row">
                <div className="flex flex-1 divide-x divide-border overflow-x-auto">
                    {visibleItems.map((item) =>
                        item.external ? (
                            <a
                                key={item.id}
                                href={item.to}
                                target="_blank"
                                rel="noreferrer"
                                className={tabClass(item.destructive)}
                            >
                                {renderInner(item)}
                            </a>
                        ) : (
                            <NavLink
                                key={item.id}
                                to={item.to}
                                exact={item.exact ?? false}
                                isActive={
                                    item.isActive
                                        ? (_, location) => item.isActive!(location.pathname)
                                        : undefined
                                }
                                className={tabClass(item.destructive)}
                                activeClassName={activeTabClass(item.destructive)}
                            >
                                {renderInner(item)}
                            </NavLink>
                        )
                    )}
                </div>
                {children && (
                    <div className="flex shrink-0 items-center justify-end border-t border-border px-4 py-2 sm:border-l sm:border-t-0">
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
};
