import React, { useEffect } from 'react';
import useSWR from 'swr';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { getDatabaseHosts } from '@/api/admin/databases';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';

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
        <div className="overflow-hidden rounded-md border border-border bg-card">
            <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-base font-semibold text-foreground">Database hosts</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        MySQL hosts that servers can use to create databases.
                    </p>
                </div>
                <Link to={`${adminPreviewBasePath}/databases/new`} className="shrink-0 no-underline">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create host
                    </Button>
                </Link>
            </div>

            {hosts.length === 0 ? (
                <p className="px-5 py-8 text-sm text-muted-foreground">
                    No database hosts yet.{' '}
                    <Link
                        to={`${adminPreviewBasePath}/databases/new`}
                        className="text-blue-400 no-underline hover:text-blue-300"
                    >
                        Add your first host
                    </Link>
                    .
                </p>
            ) : (
                <div className="divide-y divide-border">
                    {hosts.map((host) => (
                        <Link
                            key={host.id}
                            to={`${adminPreviewBasePath}/databases/${host.id}`}
                            className="block px-5 py-4 no-underline transition-colors hover:bg-muted/50"
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground">{host.name}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        <code className="text-foreground">
                                            {host.host}:{host.port}
                                        </code>
                                        {' · '}
                                        {host.username}
                                        {' · '}
                                        {host.databases_count} {host.databases_count === 1 ? 'database' : 'databases'}
                                        {' · '}
                                        {host.node ? (
                                            <span>{host.node.name}</span>
                                        ) : (
                                            <span>No linked node</span>
                                        )}
                                    </p>
                                </div>
                                <code className="shrink-0 text-xs text-muted-foreground">#{host.id}</code>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};
