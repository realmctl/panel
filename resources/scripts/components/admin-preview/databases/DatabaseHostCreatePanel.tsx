import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useHistory } from 'react-router-dom';
import { AlertTriangle, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { createDatabaseHost, getDatabaseHostCreateMeta } from '@/api/admin/databases';
import DatabaseNodeSelect from '@/components/admin-preview/databases/DatabaseNodeSelect';
import { fieldClass } from '@/components/admin-preview/settings/fieldClass';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';

export default () => {
    const history = useHistory();
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data, error, isValidating } = useSWR('admin-database-hosts-create', getDatabaseHostCreateMeta);
    const [form, setForm] = useState({
        name: '',
        host: '',
        port: '3306',
        username: '',
        password: '',
        node_id: null as number | null,
    });
    const [saving, setSaving] = useState(false);

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

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!form.password) return;

        setSaving(true);
        clearFlashes('admin-databases');

        createDatabaseHost(form)
            .then((response) => {
                addFlash({
                    key: 'admin-databases',
                    type: 'success',
                    title: 'Host created',
                    message: response.message,
                });
                history.push(`${adminPreviewBasePath}/databases/${response.host!.id}`);
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-databases', error: submitError });
            })
            .finally(() => setSaving(false));
    };

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    if (!data) {
        return <p className="text-sm text-muted-foreground">Unable to load database host form.</p>;
    }

    return (
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
                <div className="rounded-lg border border-border bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-foreground">Connection details</h2>
                    </div>
                    <div className="space-y-5 p-5">
                        <div className="space-y-2">
                            <Label htmlFor="db-name">Name</Label>
                            <input
                                id="db-name"
                                className={fieldClass}
                                value={form.name}
                                onChange={(e) => updateField('name', e.target.value)}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                A short identifier used to distinguish this host from others.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="db-host">Host</Label>
                                <input
                                    id="db-host"
                                    className={fieldClass}
                                    value={form.host}
                                    onChange={(e) => updateField('host', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="db-port">Port</Label>
                                <input
                                    id="db-port"
                                    className={fieldClass}
                                    value={form.port}
                                    onChange={(e) => updateField('port', e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="db-username">Username</Label>
                                <input
                                    id="db-username"
                                    className={fieldClass}
                                    value={form.username}
                                    onChange={(e) => updateField('username', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="db-password">Password</Label>
                                <input
                                    id="db-password"
                                    type="password"
                                    className={fieldClass}
                                    value={form.password}
                                    onChange={(e) => updateField('password', e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <DatabaseNodeSelect
                            id="db-node"
                            locations={data.locations}
                            value={form.node_id}
                            onChange={(nodeId) => updateField('node_id', nodeId)}
                        />
                    </div>
                </div>
            </div>

            <div>
                <div className="rounded-lg border border-border bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-foreground">Important</h2>
                    </div>
                    <div className="p-5">
                        <div className="flex gap-3 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-foreground">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
                            <div>
                                <p>
                                    The account defined for this database host <strong>must</strong> have the{' '}
                                    <code>WITH GRANT OPTION</code> permission.
                                </p>
                                <p className="mt-2">
                                    <strong>Do not use the same account details for MySQL that you have defined for
                                    this panel.</strong>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
                        <Link to={`${adminPreviewBasePath}/databases`} className="no-underline">
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={saving}>
                            <Save className="mr-2 h-4 w-4" />
                            {saving ? 'Creating...' : 'Create host'}
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    );
};
