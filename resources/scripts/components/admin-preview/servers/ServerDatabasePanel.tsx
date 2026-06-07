import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useParams } from 'react-router-dom';
import { RefreshCw, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/elements/Spinner';
import { Dialog } from '@/components/elements/dialog';
import useFlash from '@/plugins/useFlash';
import {
    createServerDatabase,
    deleteServerDatabase,
    getServer,
    getServerDatabases,
    resetServerDatabasePassword,
} from '@/api/admin/servers';
import {
    tableBodyCellClass,
    tableBodyRowClass,
    tableClass,
    tableHeadCellClass,
    tableHeadRowClass,
    tableWrapClass,
} from '@/components/admin-preview/adminTable';
import { fieldClass, selectClass } from '@/components/admin-preview/settings/fieldClass';

export default () => {
    const { id } = useParams<{ id: string }>();
    const serverId = Number(id);
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data: serverData } = useSWR(Number.isFinite(serverId) ? `admin-server-${serverId}` : null, () =>
        getServer(serverId)
    );
    const { data, error, isValidating, mutate } = useSWR(
        Number.isFinite(serverId) ? `admin-server-databases-${serverId}` : null,
        () => getServerDatabases(serverId)
    );
    const [form, setForm] = useState({
        database_host_id: 0,
        database: '',
        remote: '%',
        max_connections: '',
    });
    const [creating, setCreating] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
    const [working, setWorking] = useState(false);

    useEffect(() => {
        if (data?.hosts.length && !form.database_host_id) {
            setForm((current) => ({ ...current, database_host_id: data.hosts[0].id }));
        }
    }, [data, form.database_host_id]);

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-servers', error });
        } else {
            clearFlashes('admin-servers');
        }
    }, [error, clearAndAddHttpError, clearFlashes]);

    const onCreate = (event: React.FormEvent) => {
        event.preventDefault();

        setCreating(true);
        clearFlashes('admin-servers');

        createServerDatabase(serverId, {
            database_host_id: form.database_host_id,
            database: form.database.trim(),
            remote: form.remote.trim(),
            max_connections: form.max_connections ? Number(form.max_connections) : null,
        })
            .then((response) => {
                addFlash({
                    key: 'admin-servers',
                    type: 'success',
                    title: 'Database created',
                    message: response.message,
                });
                setForm((current) => ({ ...current, database: '', max_connections: '' }));
                mutate();
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-servers', error: submitError });
            })
            .finally(() => setCreating(false));
    };

    const onResetPassword = (databaseId: number) => {
        setWorking(true);
        clearFlashes('admin-servers');

        resetServerDatabasePassword(serverId, databaseId)
            .then((response) => {
                addFlash({
                    key: 'admin-servers',
                    type: 'success',
                    title: 'Password reset',
                    message: response.message,
                });
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-servers', error: submitError });
            })
            .finally(() => setWorking(false));
    };

    const onDelete = () => {
        if (confirmDelete === null) return;

        setWorking(true);
        clearFlashes('admin-servers');

        deleteServerDatabase(serverId, confirmDelete)
            .then((response) => {
                addFlash({
                    key: 'admin-servers',
                    type: 'success',
                    title: 'Database deleted',
                    message: response.message,
                });
                setConfirmDelete(null);
                mutate();
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-servers', error: submitError });
                setConfirmDelete(null);
            })
            .finally(() => setWorking(false));
    };

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    if (!data) {
        return <p className="text-sm text-muted-foreground">Unable to load databases.</p>;
    }

    const databases = data.databases ?? [];

    return (
        <>
            <Dialog.Confirm
                appearance="admin"
                title="Delete database"
                confirm="Delete"
                open={confirmDelete !== null}
                onClose={() => setConfirmDelete(null)}
                onConfirmed={onDelete}
            >
                Are you sure you want to delete this database?
            </Dialog.Confirm>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-4">
                    <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-muted-foreground">
                        Database passwords can be viewed on the client panel at{' '}
                        <a
                            href={`/server/${serverData?.server.uuid_short}/databases`}
                            className="text-primary no-underline hover:underline"
                        >
                            /server/{serverData?.server.uuid_short}/databases
                        </a>
                        .
                    </div>

                    <div className="rounded-lg border border-border bg-card">
                        <div className="border-b border-border px-5 py-4">
                            <h2 className="text-base font-semibold text-foreground">Active databases</h2>
                        </div>
                        {databases.length === 0 ? (
                            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                                No databases assigned to this server.
                            </div>
                        ) : (
                            <div className={tableWrapClass}>
                                <table className={tableClass}>
                                    <thead>
                                        <tr className={tableHeadRowClass}>
                                            <th className={tableHeadCellClass}>Database</th>
                                            <th className={tableHeadCellClass}>Username</th>
                                            <th className={tableHeadCellClass}>Connections from</th>
                                            <th className={tableHeadCellClass}>Host</th>
                                            <th className={tableHeadCellClass}>Max connections</th>
                                            <th className={tableHeadCellClass} />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {databases.map((database) => (
                                            <tr key={database.id} className={tableBodyRowClass}>
                                                <td className={tableBodyCellClass}>
                                                    <code className="text-xs">{database.database}</code>
                                                </td>
                                                <td className={tableBodyCellClass}>
                                                    <code className="text-xs">{database.username}</code>
                                                </td>
                                                <td className={tableBodyCellClass}>{database.remote}</td>
                                                <td className={tableBodyCellClass}>
                                                    {database.host ? (
                                                        <code className="text-xs">
                                                            {database.host.host}:{database.host.port}
                                                        </code>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </td>
                                                <td className={tableBodyCellClass}>
                                                    {database.max_connections ?? 'Unlimited'}
                                                </td>
                                                <td className={tableBodyCellClass}>
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            disabled={working}
                                                            onClick={() => onResetPassword(database.id)}
                                                        >
                                                            <RefreshCw className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                            disabled={working}
                                                            onClick={() => setConfirmDelete(database.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                <form onSubmit={onCreate} className="rounded-lg border border-border bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-foreground">Create new database</h2>
                    </div>
                    <div className="space-y-4 p-5">
                        <div className="space-y-2">
                            <Label htmlFor="database-host">Database host</Label>
                            <select
                                id="database-host"
                                className={selectClass}
                                value={form.database_host_id}
                                onChange={(event) => {
                                    const value = Number(event.target.value);
                                    setForm((current) => ({ ...current, database_host_id: value }));
                                }}
                            >
                                {data.hosts.map((host) => (
                                    <option key={host.id} value={host.id}>
                                        {host.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="database-name">Database</Label>
                            <div className="flex">
                                <span className="inline-flex items-center rounded-l-md border border-r-0 border-border bg-muted px-3 text-sm text-muted-foreground">
                                    s{serverId}_
                                </span>
                                <input
                                    id="database-name"
                                    className={`${fieldClass} rounded-l-none`}
                                    value={form.database}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        setForm((current) => ({ ...current, database: value }));
                                    }}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="remote">Connections</Label>
                            <input
                                id="remote"
                                className={fieldClass}
                                value={form.remote}
                                onChange={(event) => {
                                    const value = event.target.value;
                                    setForm((current) => ({ ...current, remote: value }));
                                }}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="max-connections">Concurrent connections</Label>
                            <input
                                id="max-connections"
                                className={fieldClass}
                                value={form.max_connections}
                                onChange={(event) => {
                                    const value = event.target.value;
                                    setForm((current) => ({ ...current, max_connections: value }));
                                }}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end border-t border-border px-5 py-4">
                        <Button type="submit" disabled={creating}>
                            <Save className="mr-2 h-4 w-4" />
                            {creating ? 'Creating...' : 'Create database'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
};
