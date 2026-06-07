import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Heart, HeartCrack, Lock, LockOpen, Network, Plus, Search, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { getNodeHealth, getNodes } from '@/api/admin/nodes';
import {
    tableBodyCellClass,
    tableBodyRowClass,
    tableClass,
    tableHeadCellClass,
    tableHeadRowClass,
    tableWrapClass,
} from '@/components/admin-preview/adminTable';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';
import { cn } from '@/lib/utils';
import { fieldClass } from '@/components/admin-preview/settings/fieldClass';

type HealthState = 'loading' | 'online' | 'offline';

const NodeHealthIcon = ({ nodeId }: { nodeId: number }) => {
    const [state, setState] = useState<HealthState>('loading');
    const [title, setTitle] = useState('Checking...');

    useEffect(() => {
        let cancelled = false;

        const check = () => {
            setState('loading');

            getNodeHealth(nodeId)
                .then((data) => {
                    if (cancelled) return;
                    setState('online');
                    setTitle(data.version ? `Online · v${data.version}` : 'Online');
                })
                .catch((error) => {
                    if (cancelled) return;
                    setState('offline');
                    const message =
                        error?.response?.data?.error ?? error?.response?.data?.message ?? 'Offline — could not connect';
                    setTitle(message);
                });
        };

        check();
        const interval = window.setInterval(check, 10000);

        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, [nodeId]);

    const Icon = state === 'offline' ? HeartCrack : Heart;

    return (
        <span title={title} className="inline-flex justify-center">
            <Icon
                className={cn(
                    'h-4 w-4',
                    state === 'online' && 'animate-pulse text-green-500',
                    state === 'offline' && 'text-red-500',
                    state === 'loading' && 'animate-pulse text-muted-foreground'
                )}
            />
        </span>
    );
};

export default () => {
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');

    const { data, error, isValidating } = useSWR(['admin-nodes', page, query], () =>
        getNodes({ page, filter: query ? { name: query } : undefined })
    );

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-nodes', error });
        } else {
            clearFlashes('admin-nodes');
        }
    }, [error]);

    const onSearch = (event: React.FormEvent) => {
        event.preventDefault();
        setPage(1);
        setQuery(search.trim());
    };

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    const nodes = data?.nodes ?? [];
    const pagination = data?.pagination;

    return (
        <div className="rounded-lg border border-border bg-card">
            <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-base font-semibold text-foreground">Node list</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Wings daemons connected to this panel.</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <form onSubmit={onSearch} className="flex gap-2">
                        <input
                            className={cn(fieldClass, 'w-48')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search..."
                        />
                        <Button type="submit" variant="outline" size="icon">
                            <Search className="h-4 w-4" />
                        </Button>
                    </form>
                    <Link to={`${adminPreviewBasePath}/nodes/new`} className="shrink-0 no-underline">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create new
                        </Button>
                    </Link>
                </div>
            </div>

            {nodes.length === 0 ? (
                <div className="flex flex-col items-center px-5 py-12 text-center">
                    <Network className="mb-4 h-10 w-10 text-muted-foreground" />
                    <p className="text-base font-medium text-foreground">No nodes</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {query ? 'No nodes match your search.' : 'Create a node to connect a Wings daemon.'}
                    </p>
                    {!query && (
                        <Link to={`${adminPreviewBasePath}/nodes/new`} className="mt-5 no-underline">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Create new
                            </Button>
                        </Link>
                    )}
                </div>
            ) : (
                <div className={tableWrapClass}>
                    <table className={tableClass}>
                        <thead>
                            <tr className={tableHeadRowClass}>
                                <th className={cn(tableHeadCellClass, 'w-10 text-center')} />
                                <th className={tableHeadCellClass}>Name</th>
                                <th className={tableHeadCellClass}>Location</th>
                                <th className={tableHeadCellClass}>Memory</th>
                                <th className={tableHeadCellClass}>Disk</th>
                                <th className={cn(tableHeadCellClass, 'text-center')}>Servers</th>
                                <th className={cn(tableHeadCellClass, 'text-center')}>SSL</th>
                                <th className={cn(tableHeadCellClass, 'text-center')}>Public</th>
                            </tr>
                        </thead>
                        <tbody>
                            {nodes.map((node) => (
                                <tr key={node.id} className={tableBodyRowClass}>
                                    <td className={cn(tableBodyCellClass, 'text-center')}>
                                        <NodeHealthIcon nodeId={node.id} />
                                    </td>
                                    <td className={tableBodyCellClass}>
                                        <div className="flex items-center gap-2">
                                            {node.maintenance_mode && (
                                                <span title="Maintenance mode" className="text-yellow-500">
                                                    <Wrench className="h-3.5 w-3.5" />
                                                </span>
                                            )}
                                            <Link
                                                to={`${adminPreviewBasePath}/nodes/${node.id}`}
                                                className="font-medium text-primary no-underline hover:underline"
                                            >
                                                {node.name}
                                            </Link>
                                        </div>
                                    </td>
                                    <td className={cn(tableBodyCellClass, 'text-muted-foreground')}>
                                        {node.location.short}
                                    </td>
                                    <td className={cn(tableBodyCellClass, 'text-muted-foreground')}>
                                        {node.memory} MiB
                                    </td>
                                    <td className={cn(tableBodyCellClass, 'text-muted-foreground')}>{node.disk} MiB</td>
                                    <td className={cn(tableBodyCellClass, 'text-center')}>{node.servers_count}</td>
                                    <td className={cn(tableBodyCellClass, 'text-center')}>
                                        {node.scheme === 'https' ? (
                                            <span title="HTTPS" className="text-green-500">
                                                <Lock className="inline h-3.5 w-3.5" />
                                            </span>
                                        ) : (
                                            <span title="HTTP" className="text-red-500">
                                                <LockOpen className="inline h-3.5 w-3.5" />
                                            </span>
                                        )}
                                    </td>
                                    <td className={cn(tableBodyCellClass, 'text-center')}>
                                        {node.public ? (
                                            <span title="Public" className="text-green-500">
                                                <Eye className="inline h-3.5 w-3.5" />
                                            </span>
                                        ) : (
                                            <span title="Private" className="text-muted-foreground">
                                                <EyeOff className="inline h-3.5 w-3.5" />
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
    );
};
