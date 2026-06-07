import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link } from 'react-router-dom';
import { Database, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { getDatabaseHosts } from '@/api/admin/databases';
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

export default () => {
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { data, error, isValidating } = useSWR('admin-database-hosts', getDatabaseHosts);

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-databases', error });
        } else {
            clearFlashes('admin-databases');
        }
    }, [error]);

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    const hosts = data?.hosts ?? [];

    return (
        <div className="rounded-lg border border-border bg-card">
            <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-base font-semibold text-foreground">Host list</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        MySQL hosts that servers can use to create databases.
                    </p>
                </div>
                <Link to={`${adminPreviewBasePath}/databases/new`} className="shrink-0 no-underline">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create new
                    </Button>
                </Link>
            </div>

            {hosts.length === 0 ? (
                <div className="flex flex-col items-center px-5 py-12 text-center">
                    <Database className="mb-4 h-10 w-10 text-muted-foreground" />
                    <p className="text-base font-medium text-foreground">No database hosts</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Add a database host to allow servers to create databases.
                    </p>
                    <Link to={`${adminPreviewBasePath}/databases/new`} className="mt-5 no-underline">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create new
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className={tableWrapClass}>
                    <table className={tableClass}>
                        <thead>
                            <tr className={tableHeadRowClass}>
                                <th className={tableHeadCellClass}>ID</th>
                                <th className={tableHeadCellClass}>Name</th>
                                <th className={tableHeadCellClass}>Host</th>
                                <th className={tableHeadCellClass}>Port</th>
                                <th className={tableHeadCellClass}>Username</th>
                                <th className={cn(tableHeadCellClass, 'text-center')}>Databases</th>
                                <th className={cn(tableHeadCellClass, 'text-center')}>Node</th>
                            </tr>
                        </thead>
                        <tbody>
                            {hosts.map((host) => (
                                <tr key={host.id} className={tableBodyRowClass}>
                                    <td className={tableBodyCellClass}>
                                        <code className="text-xs text-muted-foreground">{host.id}</code>
                                    </td>
                                    <td className={tableBodyCellClass}>
                                        <Link
                                            to={`${adminPreviewBasePath}/databases/${host.id}`}
                                            className="font-medium text-primary no-underline hover:underline"
                                        >
                                            {host.name}
                                        </Link>
                                    </td>
                                    <td className={tableBodyCellClass}>
                                        <code className="text-xs">{host.host}</code>
                                    </td>
                                    <td className={tableBodyCellClass}>
                                        <code className="text-xs">{host.port}</code>
                                    </td>
                                    <td className={tableBodyCellClass}>{host.username}</td>
                                    <td className={cn(tableBodyCellClass, 'text-center')}>{host.databases_count}</td>
                                    <td className={cn(tableBodyCellClass, 'text-center')}>
                                        {host.node ? (
                                            <a
                                                href={`/admin/nodes/view/${host.node.id}`}
                                                className="text-primary no-underline hover:underline"
                                            >
                                                {host.node.name}
                                            </a>
                                        ) : (
                                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                                None
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
