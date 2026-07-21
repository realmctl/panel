import React, { useMemo } from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { ChevronDown, LayoutDashboard, LogOut, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { useStoreState } from '@/state/hooks';
import http from '@/api/http';
import { REALM_FAVICON } from '@/lib/branding';
import {
    AdminRouteDefinition,
    adminRoutesBySection,
    fullPathFor,
} from '@/routers/adminRoutes';

const isRouteActive = (route: AdminRouteDefinition, pathname: string): boolean => {
    const full = fullPathFor(route);
    return route.exact ? pathname === full : pathname === full || pathname.startsWith(`${full}/`);
};

const NavCategory = ({
    label,
    items,
    pathname,
}: {
    label: string;
    items: AdminRouteDefinition[];
    pathname: string;
}) => {
    const hasActive = items.some((item) => isRouteActive(item, pathname));

    return (
        <div className="pt-2">
            <div
                className={cn(
                    'hidden h-7 items-center rounded-md px-2 text-xs font-semibold uppercase tracking-wide md:flex',
                    hasActive ? 'text-foreground' : 'text-muted-foreground'
                )}
            >
                {label}
            </div>
            <div className="space-y-1 md:mt-1">
                {items.map((item) => (
                    <NavLinkItem key={item.path} item={item} pathname={pathname} />
                ))}
            </div>
        </div>
    );
};

const NavLinkItem = ({
    item,
    pathname,
}: {
    item: AdminRouteDefinition;
    pathname: string;
}) => {
    const Icon = item.icon;
    const to = fullPathFor(item);
    const active = isRouteActive(item, pathname);

    return (
        <Link
            to={to}
            className={cn(
                'flex h-9 w-full flex-row items-center rounded-md px-2 py-1.5 text-muted-foreground transition hover:bg-muted hover:text-primary',
                active && 'bg-muted text-blue-500'
            )}
            title={item.name}
        >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="ml-2 hidden min-w-0 truncate text-sm font-medium md:block">{item.name}</span>
        </Link>
    );
};

export function AdminSidebar() {
    const { pathname } = useLocation();
    const history = useHistory();
    const panelName = useStoreState((state) => state.settings.data?.name || 'Realm');
    const username = useStoreState((state) => state.user.data?.username || 'Admin');
    const email = useStoreState((state) => state.user.data?.email || '');
    const initials = useMemo(() => username.slice(0, 2).toUpperCase(), [username]);

    const topLevelItems = adminRoutesBySection('top');
    const managementItems = adminRoutesBySection('management');
    const serviceItems = adminRoutesBySection('services');

    const onLogout = () => {
        http.post('/auth/logout').finally(() => {
            window.location.href = '/auth/login';
        });
    };

    return (
        <aside className="fixed inset-y-0 left-0 z-40 flex w-[3.05rem] shrink-0 flex-col border-r border-border bg-realm-card text-muted-foreground md:w-60">
            <div className="flex h-full flex-col">
                <div className="flex h-[54px] w-full shrink-0 border-b border-border p-2">
                    <div className="mt-[1.5px] flex w-full">
                                <DropdownMenu modal={false}>
                                    <DropdownMenuTrigger className="w-full" asChild>
                                        <Button variant="ghost" size="sm" className="flex w-fit items-center gap-2 px-2">
                                            <img
                                                src={REALM_FAVICON}
                                                alt={panelName}
                                                className="h-4 w-4 rounded-sm"
                                            />
                                            <span className="hidden w-fit items-center gap-2 md:flex">
                                                <span className="text-sm font-medium text-foreground">{panelName}</span>
                                                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                                            </span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        <DropdownMenuItem
                                            className="flex items-center gap-2"
                                            onSelect={() => history.push('/')}
                                        >
                                            <LayoutDashboard className="h-4 w-4" />
                                            Client area
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                    </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col">
                    <ScrollArea className="min-h-0 flex-1 p-2">
                        <div className="flex w-full flex-col gap-1">
                            {topLevelItems.map((item) => (
                                <NavLinkItem key={item.path} item={item} pathname={pathname} />
                            ))}

                            <Separator className="w-full" />

                            <NavCategory label="Management" items={managementItems} pathname={pathname} />

                            <Separator className="w-full" />

                            <NavCategory label="Services" items={serviceItems} pathname={pathname} />
                        </div>
                    </ScrollArea>

                    <div className="flex flex-col border-t border-border p-2">
                        <Link
                            to="/"
                            className="flex h-9 w-full flex-row items-center rounded-md px-2 py-1.5 text-muted-foreground transition hover:bg-muted hover:text-primary"
                            title="Client area"
                        >
                            <LayoutDashboard className="h-4 w-4 shrink-0" />
                            <span className="ml-2 hidden text-sm font-medium md:inline">Client area</span>
                        </Link>

                        <DropdownMenu modal={false}>
                            <DropdownMenuTrigger className="w-full">
                                <div className="flex h-9 w-full flex-row items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary">
                                    <Avatar className="h-4 w-4">
                                        <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                                    </Avatar>
                                    <span className="hidden w-full items-center gap-2 md:flex">
                                        <span className="text-sm font-medium">{username}</span>
                                        <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
                                    </span>
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent sideOffset={5}>
                                <div className="flex flex-row items-center gap-2 p-2">
                                    <Avatar className="h-6 w-6">
                                        <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col text-left">
                                        <span className="text-sm font-medium">{username}</span>
                                        <span className="line-clamp-1 text-xs text-muted-foreground">{email}</span>
                                    </div>
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="flex items-center gap-2"
                                    onSelect={() => history.push('/user')}
                                >
                                    <Users className="h-4 w-4" />
                                    My account
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex items-center gap-2" onSelect={onLogout}>
                                    <LogOut className="h-4 w-4" />
                                    Sign out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </aside>
    );
}
