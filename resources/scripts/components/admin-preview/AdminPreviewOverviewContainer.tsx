import React from 'react';
import useSWR from 'swr';
import { Link } from 'react-router-dom';
import {
    ArrowUpRight,
    BookOpen,
} from 'lucide-react';
import { useStoreState } from '@/state/hooks';
import AdminPreviewContent from '@/components/admin-preview/AdminPreviewContent';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';
import { getOverview, OverviewStats } from '@/api/admin/overview';
import Spinner from '@/components/elements/Spinner';
import { cn } from '@/lib/utils';

type ManagementSection = {
    label: string;
    href: string;
    statKey?: keyof OverviewStats;
};

const quickActions = [
    { label: 'New server', href: `${adminPreviewBasePath}/servers/new` },
    { label: 'New user', href: `${adminPreviewBasePath}/users/new` },
    { label: 'New node', href: `${adminPreviewBasePath}/nodes/new` },
    { label: 'New egg', href: `${adminPreviewBasePath}/nests/eggs/new` },
    { label: 'New database host', href: `${adminPreviewBasePath}/databases/new` },
    { label: 'Settings', href: `${adminPreviewBasePath}/settings` },
] as const;

const managementSections: ManagementSection[] = [
    { label: 'Settings', href: `${adminPreviewBasePath}/settings` },
    { label: 'API', href: `${adminPreviewBasePath}/api` },
    { label: 'Servers', href: `${adminPreviewBasePath}/servers`, statKey: 'servers' },
    { label: 'Users', href: `${adminPreviewBasePath}/users`, statKey: 'users' },
    { label: 'Nodes', href: `${adminPreviewBasePath}/nodes`, statKey: 'nodes' },
    { label: 'Locations', href: `${adminPreviewBasePath}/locations`, statKey: 'locations' },
    { label: 'Nests', href: `${adminPreviewBasePath}/nests`, statKey: 'nests' },
    { label: 'Mounts', href: `${adminPreviewBasePath}/mounts`, statKey: 'mounts' },
    { label: 'Databases', href: `${adminPreviewBasePath}/databases`, statKey: 'database_hosts' },
    { label: 'Subdomains', href: `${adminPreviewBasePath}/subdomains`, statKey: 'subdomain_domains' },
];

const overviewStats: { label: string; statKey: keyof OverviewStats; href: string }[] = [
    { label: 'Servers', statKey: 'servers', href: `${adminPreviewBasePath}/servers` },
    { label: 'Users', statKey: 'users', href: `${adminPreviewBasePath}/users` },
    { label: 'Nodes', statKey: 'nodes', href: `${adminPreviewBasePath}/nodes` },
    { label: 'Locations', statKey: 'locations', href: `${adminPreviewBasePath}/locations` },
];

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
        { label: 'Get help', description: 'Discord', href: version?.discord || 'https://realmctl.com/discord' },
        { label: 'Documentation', description: 'realmctl.com', href: 'https://realmctl.com' },
        { label: 'GitHub', description: 'Source code', href: 'https://github.com/realmctl/panel' },
        {
            label: 'Support the project',
            description: 'Donate',
            href: version?.donations || 'https://realmctl.com/sponsor',
        },
    ] as const;

    return (
        <AdminPreviewContent
            title="Overview"
            description={`Welcome back, ${username} · managing ${panelName}`}
        >
            <div className="space-y-6">
                <div className="grid grid-cols-2 overflow-hidden rounded-md border border-border bg-card divide-x divide-y divide-border lg:grid-cols-4 lg:divide-y-0">
                    {overviewStats.map((item) => (
                        <Link
                            key={item.label}
                            to={item.href}
                            className="group flex items-center justify-between gap-3 px-4 py-3 no-underline transition-colors hover:bg-muted/50"
                        >
                            <span className="text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                                {item.label}
                            </span>
                            <span className="text-lg font-semibold tabular-nums text-foreground">
                                {loadingStats ? <Spinner size="small" /> : (stats?.[item.statKey] ?? '—')}
                            </span>
                        </Link>
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <div
                        className={cn(
                            'relative h-full overflow-hidden rounded-md border bg-card p-5',
                            isLatest ? 'border-emerald-500/20' : 'border-amber-500/30'
                        )}
                    >
                        <div
                            className={cn(
                                'absolute inset-y-0 left-0 w-1',
                                isLatest ? 'bg-emerald-500' : 'bg-amber-500'
                            )}
                        />
                        <div className="pl-3">
                            <div className="min-w-0">
                                <div className="mb-2">
                                    <h2 className="text-base font-semibold text-foreground">System information</h2>
                                    <p
                                        className={cn(
                                            'mt-0.5 text-sm',
                                            isLatest ? 'text-muted-foreground' : 'text-amber-400'
                                        )}
                                    >
                                        {isLatest
                                            ? 'Your panel is on the latest public release.'
                                            : `Version ${latestVersion} is available.`}
                                    </p>
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
                                                href={`https://github.com/realmctl/panel/releases/v${latestVersion}`}
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
                                <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-md border border-border bg-muted/30 divide-x divide-border">
                                    <div className="flex min-w-0 items-center justify-between gap-2 px-4 py-2.5">
                                        <span className="shrink-0 text-sm text-muted-foreground">Panel</span>
                                        <span className="min-w-0 truncate text-right text-sm text-foreground">
                                            <code className="text-xs">{currentVersion}</code>
                                            {isLatest ? (
                                                <span className="ml-1.5 text-xs text-emerald-400">· Installed</span>
                                            ) : (
                                                <a
                                                    href={`https://github.com/realmctl/panel/releases/v${latestVersion}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="ml-1.5 inline-flex items-center gap-0.5 text-xs text-blue-400 no-underline hover:text-blue-300"
                                                >
                                                    · <code>{latestVersion}</code> available
                                                    <ArrowUpRight className="h-3 w-3 shrink-0" />
                                                </a>
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex min-w-0 items-center justify-between gap-2 px-4 py-2.5">
                                        <span className="shrink-0 text-sm text-muted-foreground">Wings</span>
                                        <span className="min-w-0 truncate text-right text-sm text-foreground">
                                            Same major version
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex h-full flex-col overflow-hidden rounded-md border border-border bg-card">
                        <div className="shrink-0 border-b border-border px-5 py-4">
                            <h2 className="text-base font-semibold text-foreground">Quick actions</h2>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                Create something new.
                            </p>
                        </div>
                        <div className="grid flex-1 auto-rows-fr grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:grid-rows-3 sm:divide-x sm:divide-y">
                            {quickActions.map((action) => (
                                <Link
                                    key={action.label}
                                    to={action.href}
                                    className="group flex h-full items-center justify-between gap-3 px-5 py-4 no-underline transition-colors hover:bg-muted/50"
                                >
                                    <span className="text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                                        {action.label}
                                    </span>
                                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-md border border-border bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-foreground">Administration</h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            All admin sections in one place.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x lg:grid-cols-3">
                        {managementSections.map((section) => {
                            const count =
                                section.statKey && stats ? stats[section.statKey] : undefined;

                            return (
                                <Link
                                    key={section.label}
                                    to={section.href}
                                    className="group flex items-center justify-between gap-3 px-5 py-3 no-underline transition-colors hover:bg-muted/50"
                                >
                                    <span className="text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                                        {section.label}
                                    </span>
                                    {section.statKey ? (
                                        <span className="text-sm font-semibold tabular-nums text-foreground">
                                            {loadingStats ? <Spinner size="small" /> : (count ?? '—')}
                                        </span>
                                    ) : (
                                        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                <div className="overflow-hidden rounded-md border border-border bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-foreground">Resources</h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Help, docs, and community links.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x lg:grid-cols-4 lg:divide-y-0">
                        {resourceLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center justify-between gap-3 px-5 py-3 no-underline transition-colors hover:bg-muted/50"
                            >
                                <span className="min-w-0">
                                    <span className="block text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                                        {link.label}
                                    </span>
                                    <span className="block truncate text-xs text-muted-foreground/80">
                                        {link.description}
                                    </span>
                                </span>
                                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </AdminPreviewContent>
    );
};
