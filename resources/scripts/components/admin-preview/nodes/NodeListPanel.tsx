import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { getNodeHealth, getNodes } from '@/api/admin/nodes';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';
import { cn } from '@/lib/utils';

type HealthState = 'loading' | 'online' | 'offline';

const HEALTH_LABEL: Record<HealthState, string> = {
    loading: 'Checking node…',
    online: 'Online',
    offline: 'Offline',
};

const HEALTH_DOT: Record<HealthState, string> = {
    loading: 'bg-muted-foreground/40',
    online: 'bg-emerald-500',
    offline: 'bg-red-500',
};

const NodeHealthDot = ({ nodeId }: { nodeId: number }) => {
    const [state, setState] = useState<HealthState>('loading');
    const [detail, setDetail] = useState<string | null>(null);
    const [version, setVersion] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const check = () => {
            getNodeHealth(nodeId)
                .then((data) => {
                    if (cancelled) return;
                    setState('online');
                    setVersion(data.version ?? null);
                    setDetail(null);
                })
                .catch((error) => {
                    if (cancelled) return;
                    setState('offline');
                    setVersion(null);
                    setDetail(
                        error?.response?.data?.error ??
                            error?.response?.data?.message ??
                            'Could not reach Wings daemon.'
                    );
                });
        };

        check();
        const interval = window.setInterval(check, 10000);

        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, [nodeId]);

    return (
        <Tooltip delayDuration={120}>
            <TooltipTrigger asChild>
                <span
                    role="img"
                    aria-label={HEALTH_LABEL[state]}
                    className={cn(
                        'inline-block h-2 w-2 shrink-0 rounded-full',
                        HEALTH_DOT[state],
                        state === 'loading' && 'animate-pulse'
                    )}
                />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-[220px]">
                <p className="font-medium text-foreground">{HEALTH_LABEL[state]}</p>
                {version && <p className="text-muted-foreground">Wings v{version}</p>}
                {detail && <p className="text-muted-foreground">{detail}</p>}
            </TooltipContent>
        </Tooltip>
    );
};

export default () => {
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const [page, setPage] = useState(1);

    const { data, error, isValidating } = useSWR(['admin-nodes', page], () => getNodes({ page }));

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-nodes', error });
        } else {
            clearFlashes('admin-nodes');
        }
    }, [error]);

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    const nodes = data?.nodes ?? [];
    const pagination = data?.pagination;

    return (
        <TooltipProvider delayDuration={120}>
            <div className="overflow-hidden rounded-md border border-border bg-card">
                <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-foreground">Nodes</h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Wings daemons connected to this panel.
                        </p>
                    </div>
                    <Link to={`${adminPreviewBasePath}/nodes/new`} className="shrink-0 no-underline">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create node
                        </Button>
                    </Link>
                </div>

                {nodes.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-muted-foreground">
                        No nodes yet.{' '}
                        <Link
                            to={`${adminPreviewBasePath}/nodes/new`}
                            className="text-blue-400 no-underline hover:text-blue-300"
                        >
                            Create your first node
                        </Link>
                        .
                    </p>
                ) : (
                    <div className="divide-y divide-border">
                        {nodes.map((node) => (
                            <div
                                key={node.id}
                                className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-muted/50"
                            >
                                <div className="mt-1.5 shrink-0">
                                    <NodeHealthDot nodeId={node.id} />
                                </div>
                                <Link
                                    to={`${adminPreviewBasePath}/nodes/${node.id}`}
                                    className="min-w-0 flex-1 no-underline"
                                >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-foreground">{node.name}</p>
                                            {node.maintenance_mode && (
                                                <span className="rounded bg-yellow-500/15 px-1.5 py-0.5 text-xs font-medium text-yellow-600 dark:text-yellow-500">
                                                    Maintenance
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {node.location.short}
                                            {' · '}
                                            {node.memory} MiB memory
                                            {' · '}
                                            {node.disk} MiB disk
                                            {' · '}
                                            {node.servers_count} {node.servers_count === 1 ? 'server' : 'servers'}
                                            {' · '}
                                            {node.scheme === 'https' ? 'HTTPS' : 'HTTP'}
                                            {' · '}
                                            {node.public ? 'Public' : 'Private'}
                                        </p>
                                    </div>
                                    <code className="shrink-0 text-xs text-muted-foreground">#{node.id}</code>
                                </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                )}

                {pagination && pagination.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-border px-5 py-4">
                        <p className="text-sm text-muted-foreground">
                            Page {pagination.current_page} of {pagination.last_page} ({pagination.total} total)
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.current_page <= 1}
                                onClick={() => setPage((current) => Math.max(1, current - 1))}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.current_page >= pagination.last_page}
                                onClick={() => setPage((current) => current + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
};
