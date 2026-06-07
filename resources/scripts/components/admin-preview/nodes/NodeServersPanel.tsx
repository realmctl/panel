import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useParams } from 'react-router-dom';
import { ExternalLink, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { getNodeServers } from '@/api/admin/nodes';
import {
    tableBodyCellClass,
    tableBodyRowClass,
    tableClass,
    tableHeadCellClass,
    tableHeadRowClass,
    tableWrapClass,
} from '@/components/admin-preview/adminTable';
import { cn } from '@/lib/utils';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';

const statusBadge = (status: 'active' | 'installing' | 'suspended') => {
    switch (status) {
        case 'suspended':
            return (
                <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-500">
                    Suspended
                </span>
            );
        case 'installing':
            return (
                <span className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-xs font-medium text-yellow-500">
                    Installing
                </span>
            );
        default:
            return (
                <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-500">
                    Active
                </span>
            );
    }
};

export default () => {
    const { id } = useParams<{ id: string }>();
    const nodeId = Number(id);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const [page, setPage] = useState(1);
    const { data, error, isValidating } = useSWR(
        Number.isFinite(nodeId) ? ['admin-node-servers', nodeId, page] : null,
        () => getNodeServers(nodeId, page)
    );

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

    if (!data) {
        return <p className="text-sm text-muted-foreground">Unable to load servers.</p>;
    }

    const servers = data.servers;
    const pagination = data.pagination;

    return (
        <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
                <h2 className="text-base font-semibold text-foreground">Servers on this node</h2>
                <p className="mt-1 text-sm text-muted-foreground">{pagination.total} total</p>
            </div>

            {servers.length === 0 ? (
                <div className="flex flex-col items-center px-5 py-12 text-center">
                    <Server className="mb-4 h-10 w-10 text-muted-foreground" />
                    <p className="text-base font-medium text-foreground">No servers</p>
                    <p className="mt-1 text-sm text-muted-foreground">No servers are assigned to this node.</p>
                </div>
            ) : (
                <div className={tableWrapClass}>
                    <table className={tableClass}>
                        <thead>
                            <tr className={tableHeadRowClass}>
                                <th className={tableHeadCellClass}>Name</th>
                                <th className={tableHeadCellClass}>UUID</th>
                                <th className={tableHeadCellClass}>Owner</th>
                                <th className={tableHeadCellClass}>Connection</th>
                                <th className={tableHeadCellClass}>Status</th>
                                <th className={cn(tableHeadCellClass, 'w-10')} />
                            </tr>
                        </thead>
                        <tbody>
                            {servers.map((server) => (
                                <tr key={server.id} className={tableBodyRowClass}>
                                    <td className={tableBodyCellClass}>
                                        <a
                                            href={`${adminPreviewBasePath}/servers/${server.id}`}
                                            className="font-medium text-primary no-underline hover:underline"
                                        >
                                            {server.name}
                                        </a>
                                    </td>
                                    <td className={tableBodyCellClass}>
                                        <code className="text-xs" title={server.uuid_short}>
                                            {server.uuid_short}
                                        </code>
                                    </td>
                                    <td className={tableBodyCellClass}>
                                        <Link
                                            to={`${adminPreviewBasePath}/users/${server.owner.id}`}
                                            className="text-primary no-underline hover:underline"
                                        >
                                            {server.owner.username}
                                        </Link>
                                    </td>
                                    <td className={tableBodyCellClass}>
                                        <code className="text-xs">
                                            {server.allocation.alias}:{server.allocation.port}
                                        </code>
                                    </td>
                                    <td className={tableBodyCellClass}>{statusBadge(server.status)}</td>
                                    <td className={tableBodyCellClass}>
                                        <a
                                            href={`/server/${server.uuid_short}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            title="Open client panel"
                                            className="text-muted-foreground hover:text-foreground"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {pagination.last_page > 1 && (
                <div className="flex items-center justify-between border-t border-border px-5 py-4">
                    <p className="text-sm text-muted-foreground">
                        Page {pagination.current_page} of {pagination.last_page}
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
