import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { getNodeServers } from '@/api/admin/nodes';
import { adminBasePath } from '@/routers/adminRoutes';

const statusLabel = (status: 'active' | 'installing' | 'suspended') => {
    switch (status) {
        case 'suspended':
            return (
                <span className="text-red-500">Suspended</span>
            );
        case 'installing':
            return (
                <span className="text-yellow-600 dark:text-yellow-500">Installing</span>
            );
        default:
            return (
                <span className="text-emerald-600 dark:text-emerald-500">Active</span>
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
        <div className="overflow-hidden rounded-md border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
                <h2 className="text-base font-semibold text-foreground">Servers</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">{pagination.total} on this node</p>
            </div>

            {servers.length === 0 ? (
                <p className="px-5 py-8 text-sm text-muted-foreground">No servers are assigned to this node.</p>
            ) : (
                <div className="divide-y divide-border">
                    {servers.map((server) => (
                        <div
                            key={server.id}
                            className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <div className="min-w-0">
                                <Link
                                    to={`${adminBasePath}/servers/${server.id}`}
                                    className="text-sm font-medium text-blue-400 no-underline hover:text-blue-300"
                                >
                                    {server.name}
                                </Link>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    <code>{server.uuid_short}</code>
                                    {' · '}
                                    <Link
                                        to={`${adminBasePath}/users/${server.owner.id}`}
                                        className="text-blue-400 no-underline hover:text-blue-300"
                                    >
                                        {server.owner.username}
                                    </Link>
                                    {' · '}
                                    <code>
                                        {server.allocation.alias}:{server.allocation.port}
                                    </code>
                                </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-3 text-xs">
                                {statusLabel(server.status)}
                                <a
                                    href={`/server/${server.uuid_short}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-400 no-underline hover:text-blue-300"
                                >
                                    Open panel
                                </a>
                            </div>
                        </div>
                    ))}
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
