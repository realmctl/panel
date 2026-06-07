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

const baseClass =
    'inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm no-underline transition-colors';

const idleClass = (destructive?: boolean) =>
    destructive
        ? 'text-destructive hover:bg-destructive/10'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground';

const activeClass = (destructive?: boolean) =>
    destructive ? 'bg-destructive/10 text-destructive' : 'bg-muted text-primary';

const renderInner = (item: TabItem) => (
    <>
        {item.icon && <item.icon className="h-4 w-4" />}
        {item.label}
    </>
);

export default ({ items, className, children }: Props) => (
    <div className={cn('mb-6 flex flex-wrap items-center gap-1 border-b border-border pb-1', className)}>
        {items
            .filter((item) => !item.hidden)
            .map((item) =>
                item.external ? (
                    <a
                        key={item.id}
                        href={item.to}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(baseClass, idleClass(item.destructive))}
                    >
                        {renderInner(item)}
                    </a>
                ) : (
                    <NavLink
                        key={item.id}
                        to={item.to}
                        exact={item.exact ?? false}
                        isActive={item.isActive ? (_, location) => item.isActive!(location.pathname) : undefined}
                        className={cn(baseClass, idleClass(item.destructive))}
                        activeClassName={activeClass(item.destructive)}
                    >
                        {renderInner(item)}
                    </NavLink>
                )
            )}
        {children && <div className="ml-auto flex items-center gap-1">{children}</div>}
    </div>
);
