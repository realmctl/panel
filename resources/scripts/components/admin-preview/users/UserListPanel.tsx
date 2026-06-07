import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link } from 'react-router-dom';
import { Lock, LockOpen, Plus, Search, Star, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { getUsers } from '@/api/admin/users';
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

export default () => {
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');

    const { data, error, isValidating } = useSWR(['admin-users', page, query], () =>
        getUsers({ page, filter: query ? { email: query } : undefined })
    );

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-users', error });
        } else {
            clearFlashes('admin-users');
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

    const users = data?.users ?? [];
    const pagination = data?.pagination ?? { current_page: 1, last_page: 1, total: 0 };

    return (
        <div className="rounded-lg border border-border bg-card">
            <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-base font-semibold text-foreground">User list</h2>
                    <p className="mt-1 text-sm text-muted-foreground">All registered panel users.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <form onSubmit={onSearch} className="flex items-center gap-2">
                        <input
                            type="text"
                            className={cn(fieldClass, 'w-48')}
                            placeholder="Search email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Button type="submit" variant="outline" size="icon">
                            <Search className="h-4 w-4" />
                        </Button>
                    </form>
                    <Link to={`${adminPreviewBasePath}/users/new`} className="no-underline">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create new
                        </Button>
                    </Link>
                </div>
            </div>

            {users.length === 0 ? (
                <div className="flex flex-col items-center px-5 py-12 text-center">
                    <Users className="mb-4 h-10 w-10 text-muted-foreground" />
                    <p className="text-base font-medium text-foreground">No users found</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {query ? 'Try a different search term.' : 'Create a user to get started.'}
                    </p>
                </div>
            ) : (
                <div className={tableWrapClass}>
                    <table className={tableClass}>
                        <thead>
                            <tr className={tableHeadRowClass}>
                                <th className={tableHeadCellClass}>ID</th>
                                <th className={tableHeadCellClass}>Email</th>
                                <th className={tableHeadCellClass}>Name</th>
                                <th className={tableHeadCellClass}>Username</th>
                                <th className={cn(tableHeadCellClass, 'text-center')}>2FA</th>
                                <th className={cn(tableHeadCellClass, 'text-center')}>Servers</th>
                                <th className={cn(tableHeadCellClass, 'text-center')}>Subuser</th>
                                <th className={tableHeadCellClass}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className={tableBodyRowClass}>
                                    <td className={tableBodyCellClass}>
                                        <code className="text-xs text-muted-foreground">{user.id}</code>
                                    </td>
                                    <td className={tableBodyCellClass}>
                                        <Link
                                            to={`${adminPreviewBasePath}/users/${user.id}`}
                                            className="inline-flex items-center gap-1 font-medium text-primary no-underline hover:underline"
                                        >
                                            {user.email}
                                            {user.root_admin && (
                                                <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                                            )}
                                        </Link>
                                    </td>
                                    <td className={tableBodyCellClass}>
                                        {user.name_last}, {user.name_first}
                                    </td>
                                    <td className={tableBodyCellClass}>{user.username}</td>
                                    <td className={cn(tableBodyCellClass, 'text-center')}>
                                        {user.use_totp ? (
                                            <Lock className="mx-auto h-4 w-4 text-green-500" />
                                        ) : (
                                            <LockOpen className="mx-auto h-4 w-4 text-red-500" />
                                        )}
                                    </td>
                                    <td className={cn(tableBodyCellClass, 'text-center')}>
                                        <Link
                                            to={`${adminPreviewBasePath}/servers?owner_id=${user.id}`}
                                            className="text-primary no-underline hover:underline"
                                        >
                                            {user.servers_count}
                                        </Link>
                                    </td>
                                    <td className={cn(tableBodyCellClass, 'text-center')}>
                                        {user.subuser_of_count}
                                    </td>
                                    <td className={tableBodyCellClass}>
                                        <img
                                            src={`https://www.gravatar.com/avatar/${user.gravatar_hash}?s=80`}
                                            alt=""
                                            className="h-8 w-8 rounded-full"
                                        />
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
