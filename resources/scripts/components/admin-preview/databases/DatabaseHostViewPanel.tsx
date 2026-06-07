import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useHistory, useParams } from 'react-router-dom';
import { AlertTriangle, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/elements/Spinner';
import { Dialog } from '@/components/elements/dialog';
import useFlash from '@/plugins/useFlash';
import {
    deleteDatabaseHost,
    getDatabaseHost,
    updateDatabaseHost,
} from '@/api/admin/databases';
import DatabaseNodeSelect from '@/components/admin-preview/databases/DatabaseNodeSelect';
import { fieldClass } from '@/components/admin-preview/settings/fieldClass';
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
    const { id } = useParams<{ id: string }>();
    const hostId = Number(id);
    const history = useHistory();
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data, error, isValidating, mutate } = useSWR(
        Number.isFinite(hostId) ? `admin-database-host-${hostId}` : null,
        () => getDatabaseHost(hostId)
    );
    const [form, setForm] = useState({
        name: '',
        host: '',
        port: '',
        username: '',
        password: '',
        node_id: null as number | null,
    });
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (data?.host) {
            setForm({
                name: data.host.name,
                host: data.host.host,
                port: String(data.host.port),
                username: data.host.username,
                password: '',
                node_id: data.host.node_id,
            });
        }
    }, [data]);

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-databases', error });
        } else {
            clearFlashes('admin-databases');
        }
    }, [error]);

    const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const onSave = (event: React.FormEvent) => {
        event.preventDefault();

        setSaving(true);
        clearFlashes('admin-databases');

        const payload: Record<string, unknown> = {
            name: form.name,
            host: form.host,
            port: form.port,
            username: form.username,
            node_id: form.node_id,
        };

        if (form.password) {
            payload.password = form.password;
        }

        updateDatabaseHost(hostId, payload)
            .then((response) => {
                addFlash({
                    key: 'admin-databases',
                    type: 'success',
                    title: 'Host saved',
                    message: response.message,
                });
                mutate();
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-databases', error: submitError });
            })
            .finally(() => setSaving(false));
    };

    const onDelete = () => {
        setDeleting(true);
        clearFlashes('admin-databases');

        deleteDatabaseHost(hostId)
            .then((response) => {
                addFlash({
                    key: 'admin-databases',
                    type: 'success',
                    title: 'Host deleted',
                    message: response.message,
                });
                history.push(`${adminPreviewBasePath}/databases`);
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-databases', error: submitError });
                setConfirmDelete(false);
            })
            .finally(() => setDeleting(false));
    };

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    if (!data) {
        return <p className="text-sm text-muted-foreground">Unable to load database host.</p>;
    }

    return (
        <>
            <Dialog.Confirm
                appearance="admin"
                title="Delete database host"
                confirm="Delete"
                open={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirmed={onDelete}
            >
                This will permanently delete this database host from the system.
            </Dialog.Confirm>

            <form onSubmit={onSave} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="rounded-lg border border-border bg-card">
                        <div className="border-b border-border px-5 py-4">
                            <h2 className="text-base font-semibold text-foreground">Host details</h2>
                        </div>
                        <div className="space-y-5 p-5">
                            <div className="space-y-2">
                                <Label htmlFor="edit-db-name">Name</Label>
                                <input
                                    id="edit-db-name"
                                    className={fieldClass}
                                    value={form.name}
                                    onChange={(e) => updateField('name', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-db-host">Host</Label>
                                <input
                                    id="edit-db-host"
                                    className={fieldClass}
                                    value={form.host}
                                    onChange={(e) => updateField('host', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-db-port">Port</Label>
                                <input
                                    id="edit-db-port"
                                    className={fieldClass}
                                    value={form.port}
                                    onChange={(e) => updateField('port', e.target.value)}
                                    required
                                />
                            </div>
                            <DatabaseNodeSelect
                                id="edit-db-node"
                                locations={data.locations}
                                value={form.node_id}
                                onChange={(nodeId) => updateField('node_id', nodeId)}
                            />
                        </div>
                    </div>

                    <div className="rounded-lg border border-border bg-card">
                        <div className="border-b border-border px-5 py-4">
                            <h2 className="text-base font-semibold text-foreground">User details</h2>
                        </div>
                        <div className="space-y-5 p-5">
                            <div className="space-y-2">
                                <Label htmlFor="edit-db-username">Username</Label>
                                <input
                                    id="edit-db-username"
                                    className={fieldClass}
                                    value={form.username}
                                    onChange={(e) => updateField('username', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-db-password">Password</Label>
                                <input
                                    id="edit-db-password"
                                    type="password"
                                    className={fieldClass}
                                    value={form.password}
                                    onChange={(e) => updateField('password', e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">Leave blank to keep the current password.</p>
                            </div>
                            <div className="flex gap-3 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-foreground">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
                                <p>
                                    The account must have the <code>WITH GRANT OPTION</code> permission. Do not use the
                                    same MySQL account used by this panel.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <Button
                        type="button"
                        variant="outline"
                        className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={deleting || saving}
                        onClick={() => setConfirmDelete(true)}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                    <Button type="submit" disabled={saving || deleting}>
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? 'Saving...' : 'Save changes'}
                    </Button>
                </div>
            </form>

            <div className="mt-6 rounded-lg border border-border bg-card">
                <div className="border-b border-border px-5 py-4">
                    <h2 className="text-base font-semibold text-foreground">Databases</h2>
                    {data.pagination.total > 0 && (
                        <p className="mt-1 text-sm text-muted-foreground">{data.pagination.total} total</p>
                    )}
                </div>
                {data.databases.length === 0 ? (
                    <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                        No databases on this host yet.
                    </p>
                ) : (
                    <div className={tableWrapClass}>
                        <table className={tableClass}>
                            <thead>
                                <tr className={tableHeadRowClass}>
                                    <th className={tableHeadCellClass}>Server</th>
                                    <th className={tableHeadCellClass}>Database name</th>
                                    <th className={tableHeadCellClass}>Username</th>
                                    <th className={tableHeadCellClass}>Connections from</th>
                                    <th className={tableHeadCellClass}>Max connections</th>
                                    <th className={cn(tableHeadCellClass, 'w-24')} />
                                </tr>
                            </thead>
                            <tbody>
                                {data.databases.map((database) => (
                                    <tr key={database.id} className={tableBodyRowClass}>
                                        <td className={tableBodyCellClass}>
                                            <a
                                                href={`${adminPreviewBasePath}/servers/${database.server.id}`}
                                                className="text-primary no-underline hover:underline"
                                            >
                                                {database.server.name}
                                            </a>
                                        </td>
                                        <td className={tableBodyCellClass}>
                                            <code className="text-xs">{database.database}</code>
                                        </td>
                                        <td className={tableBodyCellClass}>
                                            <code className="text-xs">{database.username}</code>
                                        </td>
                                        <td className={tableBodyCellClass}>{database.remote}</td>
                                        <td className={tableBodyCellClass}>
                                            {database.max_connections ?? 'Unlimited'}
                                        </td>
                                        <td className={tableBodyCellClass}>
                                            <a
                                                href={`/admin/servers/view/${database.server.id}/database`}
                                                className="text-sm text-primary no-underline hover:underline"
                                            >
                                                Manage
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
};
