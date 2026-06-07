import React, { useMemo, useState } from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Blocks,
    ChevronsUpDown,
    Database,
    Egg,
    ExternalLink,
    Folder,
    Globe,
    Globe2,
    LayoutDashboard,
    LogOut,
    Network,
    Server,
    Settings,
    Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
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
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';

const sidebarVariants = {
    open: { width: '15rem' },
    closed: { width: '3.05rem' },
};

const contentVariants = {
    open: { display: 'block', opacity: 1 },
    closed: { display: 'block', opacity: 1 },
};

const labelVariants = {
    open: {
        x: 0,
        opacity: 1,
        transition: { x: { stiffness: 1000, velocity: -100 } },
    },
    closed: {
        x: -20,
        opacity: 0,
        transition: { x: { stiffness: 100 } },
    },
};

const transitionProps = {
    type: 'tween' as const,
    ease: 'easeOut' as const,
    duration: 0.2,
};

const staggerVariants = {
    open: {
        transition: { staggerChildren: 0.03, delayChildren: 0.02 },
    },
};

interface NavItem {
    label: string;
    to: string;
    icon: React.ComponentType<{ className?: string }>;
    match?: (pathname: string) => boolean;
    badge?: string;
}

const managementItems: NavItem[] = [
    {
        label: 'Databases',
        to: `${adminPreviewBasePath}/databases`,
        icon: Database,
        match: (pathname) => pathname.startsWith(`${adminPreviewBasePath}/databases`),
    },
    {
        label: 'Locations',
        to: `${adminPreviewBasePath}/locations`,
        icon: Globe,
        match: (pathname) => pathname.startsWith(`${adminPreviewBasePath}/locations`),
    },
    {
        label: 'Nodes',
        to: `${adminPreviewBasePath}/nodes`,
        icon: Network,
        match: (pathname) => pathname.startsWith(`${adminPreviewBasePath}/nodes`),
    },
    {
        label: 'Servers',
        to: `${adminPreviewBasePath}/servers`,
        icon: Server,
        match: (pathname) => pathname.startsWith(`${adminPreviewBasePath}/servers`),
    },
    {
        label: 'Subdomains',
        to: `${adminPreviewBasePath}/subdomains`,
        icon: Globe2,
        match: (pathname) => pathname.startsWith(`${adminPreviewBasePath}/subdomains`),
    },
    {
        label: 'Users',
        to: `${adminPreviewBasePath}/users`,
        icon: Users,
        match: (pathname) => pathname.startsWith(`${adminPreviewBasePath}/users`),
    },
];

const serviceItems: NavItem[] = [
    {
        label: 'Mounts',
        to: `${adminPreviewBasePath}/mounts`,
        icon: Folder,
        match: (pathname) => pathname.startsWith(`${adminPreviewBasePath}/mounts`),
    },
    {
        label: 'Nests',
        to: `${adminPreviewBasePath}/nests`,
        icon: Egg,
        match: (pathname) => pathname.startsWith(`${adminPreviewBasePath}/nests`),
    },
];

const NavLinkItem = ({
    item,
    isCollapsed,
    pathname,
}: {
    item: NavItem;
    isCollapsed: boolean;
    pathname: string;
}) => {
    const Icon = item.icon;
    const active = item.match ? item.match(pathname) : pathname === item.to;

    return (
        <Link
            to={item.to}
            className={cn(
                'flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary',
                active && 'bg-muted text-blue-500'
            )}
        >
            <Icon className="h-4 w-4 shrink-0" />
            <motion.span variants={labelVariants} className="flex min-w-0 items-center">
                {!isCollapsed && (
                    <span className="ml-2 flex items-center gap-2 text-sm font-medium">
                        {item.label}
                        {item.badge && (
                            <Badge
                                className="flex h-fit w-fit items-center gap-1.5 rounded border-none bg-blue-500/10 px-1.5 text-blue-400"
                                variant="outline"
                            >
                                {item.badge}
                            </Badge>
                        )}
                    </span>
                )}
            </motion.span>
        </Link>
    );
};

export function AdminPreviewSidebar() {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const { pathname } = useLocation();
    const history = useHistory();
    const panelName = useStoreState((state) => state.settings.data?.name || 'Realm');
    const username = useStoreState((state) => state.user.data?.username || 'Admin');
    const email = useStoreState((state) => state.user.data?.email || '');
    const initials = useMemo(() => username.slice(0, 2).toUpperCase(), [username]);

    const topLevelItems: NavItem[] = [
        {
            label: 'Overview',
            to: adminPreviewBasePath,
            icon: LayoutDashboard,
            match: (path) => path === adminPreviewBasePath,
            badge: 'Preview',
        },
        {
            label: 'Settings',
            to: `${adminPreviewBasePath}/settings`,
            icon: Settings,
            match: (path) => path.startsWith(`${adminPreviewBasePath}/settings`),
        },
        {
            label: 'API',
            to: `${adminPreviewBasePath}/api`,
            icon: Blocks,
            match: (path) => path.startsWith(`${adminPreviewBasePath}/api`),
        },
    ];

    const onLogout = () => {
        http.post('/auth/logout').finally(() => {
            window.location.href = '/auth/login';
        });
    };

    return (
        <motion.div
            className="fixed left-0 z-40 h-full shrink-0 border-r border-border"
            initial={isCollapsed ? 'closed' : 'open'}
            animate={isCollapsed ? 'closed' : 'open'}
            variants={sidebarVariants}
            transition={transitionProps}
            onMouseEnter={() => setIsCollapsed(false)}
            onMouseLeave={() => setIsCollapsed(true)}
        >
            <motion.div
                className="relative z-40 flex h-full shrink-0 flex-col bg-realm-card text-muted-foreground transition-all"
                variants={contentVariants}
            >
                <motion.ul variants={staggerVariants} className="flex h-full flex-col">
                    <div className="flex grow flex-col items-center">
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
                                            <motion.span variants={labelVariants} className="flex w-fit items-center gap-2">
                                                {!isCollapsed && (
                                                    <>
                                                        <span className="text-sm font-medium text-foreground">
                                                            {panelName}
                                                        </span>
                                                        <ChevronsUpDown className="h-4 w-4 text-muted-foreground/50" />
                                                    </>
                                                )}
                                            </motion.span>
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
                                        <DropdownMenuItem
                                            className="flex items-center gap-2"
                                            onSelect={() => {
                                                window.location.href = '/admin';
                                            }}
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                            Legacy admin
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        <div className="flex h-full w-full flex-col">
                            <div className="flex grow flex-col gap-4">
                                <ScrollArea className="h-16 grow p-2">
                                    <div className="flex w-full flex-col gap-1">
                                        {topLevelItems.map((item) => (
                                            <NavLinkItem
                                                key={item.to}
                                                item={item}
                                                isCollapsed={isCollapsed}
                                                pathname={pathname}
                                            />
                                        ))}

                                        <Separator className="w-full" />

                                        {managementItems.map((item) => (
                                            <NavLinkItem
                                                key={item.to}
                                                item={item}
                                                isCollapsed={isCollapsed}
                                                pathname={pathname}
                                            />
                                        ))}

                                        <Separator className="w-full" />

                                        {serviceItems.map((item) => (
                                            <NavLinkItem
                                                key={item.to}
                                                item={item}
                                                isCollapsed={isCollapsed}
                                                pathname={pathname}
                                            />
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>

                            <div className="flex flex-col p-2">
                                <Link
                                    to={`${adminPreviewBasePath}/settings`}
                                    className={cn(
                                        'mt-auto flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary',
                                        pathname.startsWith(`${adminPreviewBasePath}/settings`) &&
                                            'bg-muted text-blue-500'
                                    )}
                                >
                                    <Settings className="h-4 w-4 shrink-0" />
                                    <motion.span variants={labelVariants}>
                                        {!isCollapsed && <span className="ml-2 text-sm font-medium">Settings</span>}
                                    </motion.span>
                                </Link>

                                <DropdownMenu modal={false}>
                                    <DropdownMenuTrigger className="w-full">
                                        <div className="flex h-8 w-full flex-row items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary">
                                            <Avatar className="h-4 w-4">
                                                <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                                            </Avatar>
                                            <motion.span variants={labelVariants} className="flex w-full items-center gap-2">
                                                {!isCollapsed && (
                                                    <>
                                                        <span className="text-sm font-medium">{username}</span>
                                                        <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground/50" />
                                                    </>
                                                )}
                                            </motion.span>
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
                                            onSelect={() => history.push('/account')}
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
                </motion.ul>
            </motion.div>
        </motion.div>
    );
}
