import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useParams } from 'react-router-dom';
import { Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { fieldClass, selectClass } from '@/components/admin/settings/fieldClass';
import {
    SettingRow,
    SettingsFooter,
    SettingsSection,
} from '@/components/admin/settings/settingsLayout';
import { cn } from '@/lib/utils';

export default () => {
    const { id } = useParams<{ id: string }>();
    const serverId = Number(id);
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data: serverData } = useSWR(
        Number.isFinite(serverId) ? `admin-server-${serverId}` : null,
        () => getServer(serverId)
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
            .then((response: any) => {
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
            .then((response: any) => {
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
            .then((response: any) => {
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
    const serverName = serverData?.server.name ?? `Server #${serverId}`;

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

            <div className="space-y-4">
                <div className="overflow-hidden rounded-md border border-border bg-card px-5 py-4">
                    <h2 className="text-base font-semibold text-foreground">{serverName}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Database management</p>
                </div>

                <p className="rounded-md border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-muted-foreground">
                    Database passwords can be viewed on the client panel at{' '}
                    <a
                        href={`/server/${serverData?.server.uuid_short}/databases`}
                        className="text-blue-400 no-underline hover:text-blue-300"
                    >
                        /server/{serverData?.server.uuid_short}/databases
                    </a>
                    .
                </p>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start">
                    <div className="overflow-hidden rounded-md border border-border bg-card lg:col-span-2">
                        <div className="border-b border-border px-5 py-4">
                            <h2 className="text-base font-semibold text-foreground">Active databases</h2>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                Databases assigned to this server.
                            </p>
                        </div>

                        {databases.length === 0 ? (
                            <p className="px-5 py-8 text-sm text-muted-foreground">
                                No databases assigned to this server.
                            </p>
                        ) : (
                            <div className="divide-y divide-border">
                                {databases.map((database) => (
                                    <div
                                        key={database.id}
                                        className="flex items-start justify-between gap-4 px-5 py-4"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-foreground">
                                                <code className="text-xs">{database.database}</code>
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                <code>{database.username}</code>
                                                {' · '}
                                                {database.remote}
                                                {database.host ? (
                                                    <>
                                                        {' · '}
                                                        <code>
                                                            {database.host.host}:{database.host.port}
                                                        </code>
                                                    </>
                                                ) : null}
                                                {' · '}
                                                {database.max_connections ?? 'Unlimited'} max connections
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 gap-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                disabled={working}
                                                title="Reset password"
                                                onClick={() => onResetPassword(database.id)}
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                disabled={working}
                                                title="Delete database"
                                                onClick={() => setConfirmDelete(database.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <form onSubmit={onCreate} className="space-y-4">
                        <SettingsSection
                            title="Create database"
                            description="Provision a new database on a host."
                        >
                            <SettingRow label="Database host" htmlFor="database-host" description="Host cluster to create on.">
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
                            </SettingRow>
                            <SettingRow
                                label="Database name"
                                htmlFor="database-name"
                                description="Appended to the server prefix automatically."
                            >
                                <div className="flex min-w-0">
                                    <span className="inline-flex shrink-0 items-center rounded-l-md border border-r-0 border-border bg-muted px-3 text-sm text-muted-foreground">
                                        s{serverId}_
                                    </span>
                                    <input
                                        id="database-name"
                                        className={cn(fieldClass, 'min-w-0 rounded-l-none')}
                                        value={form.database}
                                        onChange={(event) => {
                                            const value = event.target.value;
                                            setForm((current) => ({ ...current, database: value }));
                                        }}
                                        required
                                    />
                                </div>
                            </SettingRow>
                            <SettingRow
                                label="Connections from"
                                htmlFor="remote"
                                description="Remote host pattern, e.g. % for any host."
                            >
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
                            </SettingRow>
                            <SettingRow
                                label="Max connections"
                                htmlFor="max-connections"
                                description="Leave empty for unlimited."
                            >
                                <input
                                    id="max-connections"
                                    className={fieldClass}
                                    value={form.max_connections}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        setForm((current) => ({ ...current, max_connections: value }));
                                    }}
                                />
                            </SettingRow>
                        </SettingsSection>

                        <SettingsFooter>
                            <Button type="submit" disabled={creating}>
                                <Plus className="mr-2 h-4 w-4" />
                                {creating ? 'Creating...' : 'Create database'}
                            </Button>
                        </SettingsFooter>
                    </form>
                </div>
            </div>
        </>
    );
};
