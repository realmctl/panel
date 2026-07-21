import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Plus } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { getServers } from '@/api/admin/servers';
import { adminBasePath } from '@/routers/adminRoutes';

const statusLabel = (status: 'active' | 'installing' | 'suspended') => {
    switch (status) {
        case 'suspended':
            return <span className="text-red-500">Suspended</span>;
        case 'installing':
            return <span className="text-yellow-600 dark:text-yellow-500">Installing</span>;
        default:
            return <span className="text-emerald-600 dark:text-emerald-500">Active</span>;
    }
};

export default () => {
    const location = useLocation();
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const [page, setPage] = useState(1);
    const [ownerId, setOwnerId] = useState<number | undefined>();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const owner = params.get('owner_id');
        setOwnerId(owner ? Number(owner) : undefined);
        setPage(1);
    }, [location.search]);

    const { data, error, isValidating } = useSWR(['admin-servers', page, ownerId], () =>
        getServers({
            page,
            filter: ownerId ? { owner_id: ownerId } : undefined,
        })
    );

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-servers', error });
        } else {
            clearFlashes('admin-servers');
        }
    }, [error]);

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    const servers = data?.servers ?? [];
    const pagination = data?.pagination;

    return (
        <div className="overflow-hidden rounded-md border border-border bg-card">
            <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-base font-semibold text-foreground">Servers</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {ownerId ? 'Filtered by owner.' : 'All servers on this panel.'}
                    </p>
                </div>
                <Link to={`${adminBasePath}/servers/new`} className="shrink-0 no-underline">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create server
                    </Button>
                </Link>
            </div>

            {ownerId && (
                <div className="flex items-center justify-between border-b border-border bg-muted/20 px-5 py-3 text-sm">
                    <span className="text-muted-foreground">Showing servers for user #{ownerId}</span>
                    <Link
                        to={`${adminBasePath}/servers`}
                        className="text-blue-400 no-underline hover:text-blue-300"
                    >
                        Clear filter
                    </Link>
                </div>
            )}

            {servers.length === 0 ? (
                <p className="px-5 py-8 text-sm text-muted-foreground">
                    {ownerId ? (
                        'No servers for this user.'
                    ) : (
                        <>
                            No servers yet.{' '}
                            <Link
                                to={`${adminBasePath}/servers/new`}
                                className="text-blue-400 no-underline hover:text-blue-300"
                            >
                                Create your first server
                            </Link>
                            .
                        </>
                    )}
                </p>
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
                                    {server.owner && (
                                        <>
                                            {' · '}
                                            <Link
                                                to={`${adminBasePath}/users/${server.owner.id}`}
                                                className="text-blue-400 no-underline hover:text-blue-300"
                                            >
                                                {server.owner.username}
                                            </Link>
                                        </>
                                    )}
                                    {server.node && (
                                        <>
                                            {' · '}
                                            <Link
                                                to={`${adminBasePath}/nodes/${server.node.id}`}
                                                className="text-blue-400 no-underline hover:text-blue-300"
                                            >
                                                {server.node.name}
                                            </Link>
                                        </>
                                    )}
                                    {server.allocation && (
                                        <>
                                            {' · '}
                                            <code>
                                                {server.allocation.alias ?? ''}:{server.allocation.port}
                                            </code>
                                        </>
                                    )}
                                </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-3 text-xs">
                                {statusLabel(server.status)}
                                <a
                                    href={`/instance/${server.uuid_short}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-400 no-underline hover:text-blue-300"
                                >
                                    Open panel
                                </a>
                                <code className="text-muted-foreground">#{server.id}</code>
                            </div>
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
    );
};
