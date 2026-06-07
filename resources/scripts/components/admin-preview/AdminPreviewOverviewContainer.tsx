import React from 'react';
import useSWR from 'swr';
import { Link } from 'react-router-dom';
import {
    ArrowUpRight,
    BookOpen,
    ChevronRight,
    Code2,
    Database,
    Egg,
    Folder,
    Globe,
    Globe2,
    Heart,
    Info,
    LifeBuoy,
    LucideIcon,
    MapPin,
    Network,
    Plug,
    Server,
    Settings,
    UserPlus,
    Users,
} from 'lucide-react';
import { useStoreState } from '@/state/hooks';
import AdminPreviewContent from '@/components/admin-preview/AdminPreviewContent';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';
import { getOverview, OverviewStats } from '@/api/admin/overview';
import { Badge } from '@/components/ui/badge';
import Spinner from '@/components/elements/Spinner';
import { cn } from '@/lib/utils';

type QuickAction = {
    label: string;
    href: string;
    icon: LucideIcon;
    external?: boolean;
    legacy?: boolean;
};

type ManagementSection = {
    label: string;
    href: string;
    icon: LucideIcon;
    statKey?: keyof OverviewStats;
    description: string;
};

const quickActions: QuickAction[] = [
    { label: 'New Server', href: `${adminPreviewBasePath}/servers/new`, icon: Server },
    { label: 'New User', href: `${adminPreviewBasePath}/users/new`, icon: UserPlus },
    { label: 'New Node', href: `${adminPreviewBasePath}/nodes/new`, icon: Network },
    { label: 'New Egg', href: `${adminPreviewBasePath}/nests/eggs/new`, icon: Egg },
    { label: 'New Database Host', href: `${adminPreviewBasePath}/databases/new`, icon: Database },
    { label: 'Settings', href: `${adminPreviewBasePath}/settings`, icon: Settings },
];

const managementSections: ManagementSection[] = [
    {
        label: 'Settings',
        href: `${adminPreviewBasePath}/settings`,
        icon: Settings,
        description: 'General, mail, security, and OAuth',
    },
    {
        label: 'API',
        href: `${adminPreviewBasePath}/api`,
        icon: Plug,
        description: 'Application API keys',
    },
    {
        label: 'Databases',
        href: `${adminPreviewBasePath}/databases`,
        icon: Database,
        statKey: 'database_hosts',
        description: 'Database hosts',
    },
    {
        label: 'Locations',
        href: `${adminPreviewBasePath}/locations`,
        icon: MapPin,
        statKey: 'locations',
        description: 'Geographic locations',
    },
    {
        label: 'Nodes',
        href: `${adminPreviewBasePath}/nodes`,
        icon: Network,
        statKey: 'nodes',
        description: 'Wings nodes and allocations',
    },
    {
        label: 'Servers',
        href: `${adminPreviewBasePath}/servers`,
        icon: Server,
        statKey: 'servers',
        description: 'Game and application servers',
    },
    {
        label: 'Subdomains',
        href: `${adminPreviewBasePath}/subdomains`,
        icon: Globe2,
        statKey: 'subdomain_domains',
        description: 'DNS domains and records',
    },
    {
        label: 'Users',
        href: `${adminPreviewBasePath}/users`,
        icon: Users,
        statKey: 'users',
        description: 'Panel accounts and permissions',
    },
    {
        label: 'Mounts',
        href: `${adminPreviewBasePath}/mounts`,
        icon: Folder,
        statKey: 'mounts',
        description: 'Shared volume mounts',
    },
    {
        label: 'Nests',
        href: `${adminPreviewBasePath}/nests`,
        icon: Egg,
        statKey: 'nests',
        description: 'Eggs and service templates',
    },
];

const StatCard = ({
    label,
    value,
    href,
    icon: Icon,
    loading,
}: {
    label: string;
    value: number | undefined;
    href: string;
    icon: LucideIcon;
    loading: boolean;
}) => (
    <Link
        to={href}
        className="group flex flex-col rounded-lg border border-border bg-card p-4 no-underline transition-colors hover:bg-muted/50"
    >
        <div className="mb-3 flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        <p className="text-2xl font-semibold tabular-nums text-foreground">
            {loading ? <Spinner size="small" /> : (value ?? '—')}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
    </Link>
);

const QuickActionLink = ({ action }: { action: QuickAction }) => {
    const Icon = action.icon;
    const className =
        'flex items-center gap-3 rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground no-underline transition-colors hover:bg-muted';

    const content = (
        <>
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">{action.label}</span>
            {action.legacy && (
                <Badge variant="outline" className="shrink-0 border-none bg-muted text-[10px] text-muted-foreground">
                    Legacy
                </Badge>
            )}
            {action.external && <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
        </>
    );

    if (action.external) {
        return (
            <a href={action.href} className={className}>
                {content}
            </a>
        );
    }

    return (
        <Link to={action.href} className={className}>
            {content}
        </Link>
    );
};

export default () => {
    const panelName = useStoreState((state) => state.settings.data?.name || 'Realm');
    const username = useStoreState((state) => state.user.data?.username || 'admin');
    const version = useStoreState((state) => state.settings.data?.version);

    const { data, isValidating } = useSWR('admin-overview', getOverview);
    const stats = data?.stats;
    const loadingStats = !stats && isValidating;

    const currentVersion = version?.current || 'unknown';
    const latestVersion = version?.latest || currentVersion;
    const isLatest = version?.isLatest ?? true;

    const resourceLinks = [
        {
            label: 'Get Help',
            description: 'via Discord',
            href: version?.discord || 'https://realmctl.com/discord',
            icon: LifeBuoy,
            iconClass: 'text-amber-400 bg-amber-500/10',
        },
        {
            label: 'Documentation',
            description: 'realmctl.com',
            href: 'https://realmctl.com',
            icon: BookOpen,
            iconClass: 'text-primary bg-primary/10',
        },
        {
            label: 'GitHub',
            description: 'Source code',
            href: 'https://github.com/realmopensource/panel',
            icon: Code2,
            iconClass: 'text-neutral-300 bg-neutral-500/10',
        },
        {
            label: 'Support the Project',
            description: 'Donate',
            href: version?.donations || 'https://realmctl.com/sponsor',
            icon: Heart,
            iconClass: 'text-emerald-400 bg-emerald-500/10',
        },
    ];

    return (
        <AdminPreviewContent
            title="Overview"
            description={`Welcome back, ${username} · managing ${panelName}`}
        >
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <StatCard
                        label="Servers"
                        value={stats?.servers}
                        href={`${adminPreviewBasePath}/servers`}
                        icon={Server}
                        loading={loadingStats}
                    />
                    <StatCard
                        label="Users"
                        value={stats?.users}
                        href={`${adminPreviewBasePath}/users`}
                        icon={Users}
                        loading={loadingStats}
                    />
                    <StatCard
                        label="Nodes"
                        value={stats?.nodes}
                        href={`${adminPreviewBasePath}/nodes`}
                        icon={Network}
                        loading={loadingStats}
                    />
                    <StatCard
                        label="Locations"
                        value={stats?.locations}
                        href={`${adminPreviewBasePath}/locations`}
                        icon={Globe}
                        loading={loadingStats}
                    />
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <div
                        className={cn(
                            'relative overflow-hidden rounded-lg border bg-card p-5',
                            isLatest ? 'border-emerald-500/20' : 'border-amber-500/30'
                        )}
                    >
                        <div
                            className={cn(
                                'absolute inset-y-0 left-0 w-1',
                                isLatest ? 'bg-emerald-500' : 'bg-amber-500'
                            )}
                        />
                        <div className="flex items-start gap-4 pl-3">
                            <div
                                className={cn(
                                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                                    isLatest ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                                )}
                            >
                                <Info className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                    <h2 className="text-base font-semibold text-foreground">System information</h2>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            'border-none',
                                            isLatest
                                                ? 'bg-emerald-500/10 text-emerald-400'
                                                : 'bg-amber-500/10 text-amber-400'
                                        )}
                                    >
                                        {isLatest ? 'Up to date' : 'Update available'}
                                    </Badge>
                                </div>
                                {isLatest ? (
                                    <div className="space-y-2 text-sm text-muted-foreground">
                                        <p>
                                            You are running {panelName} version{' '}
                                            <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">
                                                {currentVersion}
                                            </code>
                                            . This matches the latest public release, so your panel includes the most
                                            recent security patches, bug fixes, and features shipped with Realm 1.0.
                                        </p>
                                        <p>
                                            No action is required right now. When a new version is published, it will
                                            appear here so you can plan an upgrade. Keep Wings on the same major version
                                            as the panel for a stable setup.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 text-sm text-muted-foreground">
                                        <p>
                                            Your panel is running version{' '}
                                            <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">
                                                {currentVersion}
                                            </code>
                                            , but a newer release is available:{' '}
                                            <a
                                                href={`https://github.com/realmopensource/panel/releases/v${latestVersion}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-400 hover:text-blue-300"
                                            >
                                                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                                                    {latestVersion}
                                                </code>
                                            </a>
                                            . Staying current helps you receive security fixes, performance improvements,
                                            and compatibility updates for Wings and bundled eggs.
                                        </p>
                                        <p>
                                            Before upgrading, back up your database and{' '}
                                            <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">
                                                .env
                                            </code>{' '}
                                            file (especially{' '}
                                            <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">
                                                APP_KEY
                                            </code>
                                            ). Put the panel in maintenance mode, run migrations, and update Wings
                                            afterward so both components stay in sync.
                                        </p>
                                        <a
                                            href="https://realmctl.com/panel/1.0/updating.html"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 no-underline hover:text-blue-300"
                                        >
                                            <BookOpen className="h-4 w-4" />
                                            Read the panel update guide
                                            <ArrowUpRight className="h-3.5 w-3.5" />
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-border bg-card">
                        <div className="border-b border-border px-5 py-4">
                            <h2 className="text-base font-semibold text-foreground">Quick actions</h2>
                            <p className="mt-1 text-sm text-muted-foreground">Create resources and open settings.</p>
                        </div>
                        <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2">
                            {quickActions.map((action) => (
                                <QuickActionLink key={action.label} action={action} />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border border-border bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-foreground">Administration</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Jump to any section in the admin preview.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
                        {managementSections.map((section) => {
                            const Icon = section.icon;
                            const count =
                                section.statKey && stats ? stats[section.statKey] : undefined;

                            return (
                                <Link
                                    key={section.label}
                                    to={section.href}
                                    className="group flex items-start gap-3 rounded-md border border-border bg-background px-4 py-3 no-underline transition-colors hover:bg-muted"
                                >
                                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                                        <Icon className="h-4 w-4" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-foreground">
                                                {section.label}
                                            </span>
                                            {count !== undefined && (
                                                <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] tabular-nums text-muted-foreground">
                                                    {count}
                                                </span>
                                            )}
                                        </span>
                                        <span className="mt-0.5 block text-xs text-muted-foreground">
                                            {section.description}
                                        </span>
                                    </span>
                                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                                </Link>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {resourceLinks.map((link) => {
                        const Icon = link.icon;

                        return (
                            <a
                                key={link.label}
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 no-underline transition-colors hover:bg-muted"
                            >
                                <span
                                    className={cn(
                                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                                        link.iconClass
                                    )}
                                >
                                    <Icon className="h-5 w-5" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground">{link.label}</p>
                                    <p className="text-xs text-muted-foreground">{link.description}</p>
                                </div>
                            </a>
                        );
                    })}
                </div>
            </div>
        </AdminPreviewContent>
    );
};
