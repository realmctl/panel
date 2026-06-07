import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { ExternalLink, Plus, Search, Server } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { getServers } from '@/api/admin/servers';
import {
    tableBodyCellClass,
    tableBodyRowClass,
    tableClass,
    tableHeadCellClass,
    tableHeadRowClass,
    tableWrapClass,
} from '@/components/admin-preview/adminTable';
import { fieldClass } from '@/components/admin-preview/settings/fieldClass';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';
import { cn } from '@/lib/utils';

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
    const location = useLocation();
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [ownerId, setOwnerId] = useState<number | undefined>();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const owner = params.get('owner_id');
        setOwnerId(owner ? Number(owner) : undefined);
        setPage(1);
    }, [location.search]);

    const { data, error, isValidating } = useSWR(['admin-servers', page, query, ownerId], () =>
        getServers({
            page,
            filter: {
                ...(query ? { '*': query } : {}),
                ...(ownerId ? { owner_id: ownerId } : {}),
            },
        })
    );

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-servers', error });
        } else {
            clearFlashes('admin-servers');
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

    const servers = data?.servers ?? [];
    const pagination = data?.pagination;

    return (
        <div className="rounded-lg border border-border bg-card">
            <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-base font-semibold text-foreground">Server list</h2>
                    <p className="mt-1 text-sm text-muted-foreground">All servers on this panel.</p>
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
                    <Link to={`${adminPreviewBasePath}/servers/new`} className="shrink-0 no-underline">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create new
                        </Button>
                    </Link>
                </div>
            </div>

            {servers.length === 0 ? (
                <div className="flex flex-col items-center px-5 py-12 text-center">
                    <Server className="mb-4 h-10 w-10 text-muted-foreground" />
                    <p className="text-base font-medium text-foreground">No servers</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {query ? 'No servers match your search.' : 'No servers have been created yet.'}
                    </p>
                </div>
            ) : (
                <div className={tableWrapClass}>
                    <table className={tableClass}>
                        <thead>
                            <tr className={tableHeadRowClass}>
                                <th className={tableHeadCellClass}>Server name</th>
                                <th className={tableHeadCellClass}>UUID</th>
                                <th className={tableHeadCellClass}>Owner</th>
                                <th className={tableHeadCellClass}>Node</th>
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
                                        <code className="text-xs" title={server.uuid}>
                                            {server.uuid_short}
                                        </code>
                                    </td>
                                    <td className={tableBodyCellClass}>
                                        {server.owner ? (
                                            <Link
                                                to={`${adminPreviewBasePath}/users/${server.owner.id}`}
                                                className="text-primary no-underline hover:underline"
                                            >
                                                {server.owner.username}
                                            </Link>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">—</span>
                                        )}
                                    </td>
                                    <td className={tableBodyCellClass}>
                                        {server.node ? (
                                            <a
                                                href={`${adminPreviewBasePath}/nodes/${server.node.id}`}
                                                className="text-primary no-underline hover:underline"
                                            >
                                                {server.node.name}
                                            </a>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">—</span>
                                        )}
                                    </td>
                                    <td className={tableBodyCellClass}>
                                        {server.allocation ? (
                                            <code className="text-xs">
                                                {server.allocation.alias ?? ''}:{server.allocation.port}
                                            </code>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">—</span>
                                        )}
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
