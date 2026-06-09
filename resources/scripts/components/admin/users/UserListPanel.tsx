import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { getUsers } from '@/api/admin/users';
import { adminBasePath } from '@/routers/adminRoutes';

export default () => {
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const [page, setPage] = useState(1);

    const { data, error, isValidating } = useSWR(['admin-users', page], () => getUsers({ page }));

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-users', error });
        } else {
            clearFlashes('admin-users');
        }
    }, [error]);

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    const users = data?.users ?? [];
    const pagination = data?.pagination ?? { current_page: 1, last_page: 1, total: 0 };

    return (
        <div className="overflow-hidden rounded-md border border-border bg-card">
            <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-base font-semibold text-foreground">Users</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">All registered panel accounts.</p>
                </div>
                <Link to={`${adminBasePath}/users/new`} className="shrink-0 no-underline">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create user
                    </Button>
                </Link>
            </div>

            {users.length === 0 ? (
                <p className="px-5 py-8 text-sm text-muted-foreground">
                    No users yet.{' '}
                    <Link
                        to={`${adminBasePath}/users/new`}
                        className="text-blue-400 no-underline hover:text-blue-300"
                    >
                        Create your first user
                    </Link>
                    .
                </p>
            ) : (
                <div className="divide-y divide-border">
                    {users.map((user) => (
                        <div
                            key={user.id}
                            className="flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/50"
                        >
                            <Link
                                to={`${adminBasePath}/users/${user.id}`}
                                className="min-w-0 flex-1 no-underline"
                            >
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-medium text-foreground">{user.email}</p>
                                    {user.root_admin && (
                                        <span className="rounded bg-yellow-500/15 px-1.5 py-0.5 text-xs font-medium text-yellow-600 dark:text-yellow-500">
                                            Admin
                                        </span>
                                    )}
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    @{user.username} · {user.name_first} {user.name_last}
                                    {' · '}
                                    {user.use_totp ? '2FA enabled' : 'No 2FA'}
                                    {user.subuser_of_count > 0 && (
                                        <>
                                            {' · '}
                                            {user.subuser_of_count} subuser
                                            {user.subuser_of_count === 1 ? '' : 's'}
                                        </>
                                    )}
                                </p>
                            </Link>
                            <div className="shrink-0 text-right text-xs text-muted-foreground">
                                <Link
                                    to={`${adminBasePath}/servers?owner_id=${user.id}`}
                                    className="block text-blue-400 no-underline hover:text-blue-300"
                                >
                                    {user.servers_count} {user.servers_count === 1 ? 'server' : 'servers'}
                                </Link>
                                <code className="mt-1 inline-block">#{user.id}</code>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {pagination.last_page > 1 && (
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
