import React from 'react';
import {
    BookOpen,
    Database,
    Egg,
    ExternalLink,
    Code2,
    Heart,
    Info,
    LifeBuoy,
    Network,
    Server,
    Settings,
    UserPlus,
} from 'lucide-react';
import { useStoreState } from '@/state/hooks';
import AdminPreviewContent from '@/components/admin-preview/AdminPreviewContent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const quickActions = [
    { label: 'New Server', href: '/admin/servers/new', icon: Server },
    { label: 'New User', href: '/admin/users/new', icon: UserPlus },
    { label: 'New Node', href: '/admin/nodes/new', icon: Network },
    { label: 'New Egg', href: '/admin/nests/egg/new', icon: Egg },
    { label: 'New Database Host', href: '/admin/databases/new', icon: Database },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export default () => {
    const panelName = useStoreState((state) => state.settings.data?.name || 'Realm');
    const username = useStoreState((state) => state.user.data?.username || 'admin');
    const version = useStoreState((state) => state.settings.data?.version);

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
            iconClass: 'text-blue-400 bg-blue-500/10',
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
        <AdminPreviewContent title={'Overview'} description={`Welcome back, ${username}`}>
            <div className="space-y-6">
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
                                <p className="text-sm text-muted-foreground">
                                    You are running {panelName} version{' '}
                                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">
                                        {currentVersion}
                                    </code>
                                    . Your panel is up-to-date.
                                </p>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Your panel is <strong className="text-foreground">not up-to-date.</strong> The latest
                                    version is{' '}
                                    <a
                                        href={`https://github.com/realmopensource/panel/releases/v${latestVersion}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:text-blue-300"
                                    >
                                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{latestVersion}</code>
                                    </a>{' '}
                                    and you are currently running{' '}
                                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">
                                        {currentVersion}
                                    </code>
                                    .
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border border-border bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-foreground">Quick actions</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Common admin tasks. These still open in the legacy admin for now.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
                        {quickActions.map((action) => {
                            const Icon = action.icon;

                            return (
                                <a
                                    key={action.label}
                                    href={action.href}
                                    className="flex items-center gap-3 rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground no-underline transition-colors hover:bg-muted"
                                >
                                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    <span>{action.label}</span>
                                </a>
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

                <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-border bg-card/50 p-4">
                    <p className="text-sm text-muted-foreground">
                        Sections not yet available in this preview still live in the legacy admin.
                    </p>
                    <a href="/admin" className="no-underline">
                        <Button variant="outline" size="sm">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open legacy admin
                        </Button>
                    </a>
                </div>
            </div>
        </AdminPreviewContent>
    );
};
