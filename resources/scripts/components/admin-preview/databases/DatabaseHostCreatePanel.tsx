import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useHistory } from 'react-router-dom';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { createDatabaseHost, getDatabaseHostCreateMeta } from '@/api/admin/databases';
import DatabaseNodeSelect from '@/components/admin-preview/databases/DatabaseNodeSelect';
import { fieldClass } from '@/components/admin-preview/settings/fieldClass';
import { SettingRow, SettingsFooter, SettingsSection } from '@/components/admin-preview/settings/settingsLayout';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';
import { cn } from '@/lib/utils';

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
        <form onSubmit={onSubmit} className="space-y-4">
            <SettingsSection
                title="Connection"
                description="MySQL host details. The account must have WITH GRANT OPTION. Do not reuse the panel's own MySQL credentials."
            >
                <SettingRow
                    label="Name"
                    htmlFor="db-name"
                    description="A short identifier to distinguish this host."
                >
                    <input
                        id="db-name"
                        className={fieldClass}
                        value={form.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        required
                    />
                </SettingRow>
                <SettingRow label="Host & port" description="Hostname or IP and MySQL port.">
                    <div className="grid grid-cols-3 gap-2">
                        <input
                            id="db-host"
                            className={cn(fieldClass, 'col-span-2')}
                            value={form.host}
                            onChange={(e) => updateField('host', e.target.value)}
                            placeholder="Host"
                            required
                            aria-label="Host"
                        />
                        <input
                            id="db-port"
                            className={fieldClass}
                            value={form.port}
                            onChange={(e) => updateField('port', e.target.value)}
                            placeholder="Port"
                            required
                            aria-label="Port"
                        />
                    </div>
                </SettingRow>
                <SettingRow
                    label="Linked node"
                    htmlFor="db-node"
                    description="Default host when adding a database on this node."
                >
                    <DatabaseNodeSelect
                        id="db-node"
                        locations={data.locations}
                        value={form.node_id}
                        onChange={(nodeId) => updateField('node_id', nodeId)}
                    />
                </SettingRow>
            </SettingsSection>

            <SettingsSection title="Credentials" description="MySQL user the panel uses to create databases.">
                <SettingRow label="Username" htmlFor="db-username" description="Database user with grant permissions.">
                    <input
                        id="db-username"
                        className={fieldClass}
                        value={form.username}
                        onChange={(e) => updateField('username', e.target.value)}
                        required
                    />
                </SettingRow>
                <SettingRow label="Password" htmlFor="db-password" description="Password for the database user.">
                    <input
                        id="db-password"
                        type="password"
                        className={fieldClass}
                        value={form.password}
                        onChange={(e) => updateField('password', e.target.value)}
                        required
                    />
                </SettingRow>
            </SettingsSection>

            <SettingsFooter>
                <Link to={`${adminPreviewBasePath}/databases`} className="no-underline">
                    <Button type="button" variant="outline">
                        Cancel
                    </Button>
                </Link>
                <Button type="submit" disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Creating...' : 'Create host'}
                </Button>
            </SettingsFooter>
        </form>
    );
};
