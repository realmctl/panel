import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useHistory, useParams } from 'react-router-dom';
import { Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import { Dialog } from '@/components/elements/dialog';
import useFlash from '@/plugins/useFlash';
import {
    deleteDatabaseHost,
    getDatabaseHost,
    updateDatabaseHost,
} from '@/api/admin/databases';
import DatabaseNodeSelect from '@/components/admin/databases/DatabaseNodeSelect';
import { fieldClass } from '@/components/admin/settings/fieldClass';
import { SettingRow, SettingsFooter, SettingsSection } from '@/components/admin/settings/settingsLayout';
import { adminBasePath } from '@/routers/adminRoutes';
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
            .then((response: any) => {
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
            .then((response: any) => {
                addFlash({
                    key: 'admin-databases',
                    type: 'success',
                    title: 'Host deleted',
                    message: response.message,
                });
                history.push(`${adminBasePath}/databases`);
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

            <form onSubmit={onSave} className="space-y-4">
                <SettingsSection
                    title="Connection"
                    description="MySQL host details. The account must have WITH GRANT OPTION."
                >
                    <SettingRow label="Name" htmlFor="edit-db-name" description="Identifier for this host.">
                        <input
                            id="edit-db-name"
                            className={fieldClass}
                            value={form.name}
                            onChange={(e) => updateField('name', e.target.value)}
                            required
                        />
                    </SettingRow>
                    <SettingRow label="Host & port" description="Hostname or IP and MySQL port.">
                        <div className="grid grid-cols-3 gap-2">
                            <input
                                id="edit-db-host"
                                className={cn(fieldClass, 'col-span-2')}
                                value={form.host}
                                onChange={(e) => updateField('host', e.target.value)}
                                required
                                aria-label="Host"
                            />
                            <input
                                id="edit-db-port"
                                className={fieldClass}
                                value={form.port}
                                onChange={(e) => updateField('port', e.target.value)}
                                required
                                aria-label="Port"
                            />
                        </div>
                    </SettingRow>
                    <SettingRow
                        label="Linked node"
                        htmlFor="edit-db-node"
                        description="Default host when adding a database on this node."
                    >
                        <DatabaseNodeSelect
                            id="edit-db-node"
                            locations={data.locations}
                            value={form.node_id}
                            onChange={(nodeId) => updateField('node_id', nodeId)}
                        />
                    </SettingRow>
                </SettingsSection>

                <SettingsSection title="Credentials" description="Do not reuse the panel's own MySQL account.">
                    <SettingRow label="Username" htmlFor="edit-db-username" description="Database user with grant permissions.">
                        <input
                            id="edit-db-username"
                            className={fieldClass}
                            value={form.username}
                            onChange={(e) => updateField('username', e.target.value)}
                            required
                        />
                    </SettingRow>
                    <SettingRow
                        label="Password"
                        htmlFor="edit-db-password"
                        description="Leave blank to keep the current password."
                    >
                        <input
                            id="edit-db-password"
                            type="password"
                            className={fieldClass}
                            value={form.password}
                            onChange={(e) => updateField('password', e.target.value)}
                        />
                    </SettingRow>
                </SettingsSection>

                <SettingsFooter>
                    <Button
                        type="button"
                        variant="outline"
                        className="mr-auto border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
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
                </SettingsFooter>
            </form>

            <div className="mt-4 overflow-hidden rounded-md border border-border bg-card">
                <div className="border-b border-border px-5 py-4">
                    <h2 className="text-base font-semibold text-foreground">Databases</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {data.pagination.total === 0
                            ? 'No databases on this host yet.'
                            : `${data.pagination.total} database${data.pagination.total === 1 ? '' : 's'} on this host`}
                    </p>
                </div>
                {data.databases.length > 0 && (
                    <div className="divide-y divide-border">
                        {data.databases.map((database) => (
                            <div
                                key={database.id}
                                className="flex items-center justify-between gap-4 px-5 py-4"
                            >
                                <div className="min-w-0">
                                    <Link
                                        to={`${adminBasePath}/servers/${database.server.id}`}
                                        className="text-sm font-medium text-foreground no-underline hover:text-blue-400"
                                    >
                                        {database.server.name}
                                    </Link>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        <code className="text-foreground">{database.database}</code>
                                        {' · '}
                                        <code>{database.username}</code>
                                        {' · '}
                                        From {database.remote}
                                        {' · '}
                                        {database.max_connections ?? 'Unlimited'} max connections
                                    </p>
                                </div>
                                <Link
                                    to={`${adminBasePath}/servers/${database.server.id}/database`}
                                    className="shrink-0 text-sm text-blue-400 no-underline hover:text-blue-300"
                                >
                                    Manage
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};
