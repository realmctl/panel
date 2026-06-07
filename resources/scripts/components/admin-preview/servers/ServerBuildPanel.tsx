import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useParams } from 'react-router-dom';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { getServer, getServerBuild, updateServerBuild } from '@/api/admin/servers';
import { fieldClass, selectClass } from '@/components/admin-preview/settings/fieldClass';
import {
    SegmentedControl,
    SettingRow,
    SettingsFooter,
    SettingsSection,
} from '@/components/admin-preview/settings/settingsLayout';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';
import { cn } from '@/lib/utils';

const UnitInput = ({
    id,
    value,
    onChange,
    unit,
}: {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    unit: string;
}) => (
    <div className="flex min-w-0">
        <input
            id={id}
            className={cn(fieldClass, 'min-w-0 rounded-r-none')}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
        <span className="inline-flex shrink-0 items-center rounded-r-md border border-l-0 border-border bg-muted px-3 text-sm text-muted-foreground">
            {unit}
        </span>
    </div>
);

export default () => {
    const { id } = useParams<{ id: string }>();
    const serverId = Number(id);
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data: serverData } = useSWR(
        Number.isFinite(serverId) ? `admin-server-${serverId}` : null,
        () => getServer(serverId)
    );
    const { data, error, isValidating, mutate } = useSWR(
        Number.isFinite(serverId) ? `admin-server-build-${serverId}` : null,
        () => getServerBuild(serverId)
    );
    const [form, setForm] = useState({
        allocation_id: 0,
        cpu: '',
        threads: '',
        memory: '',
        swap: '',
        disk: '',
        io: '',
        oom_disabled: 0,
        database_limit: '',
        allocation_limit: '',
        backup_limit: '',
        subdomain_limit: '',
        add_allocations: [] as number[],
        remove_allocations: [] as number[],
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (data?.server) {
            const server = data.server;
            setForm({
                allocation_id: server.allocation_id,
                cpu: String(server.cpu),
                threads: server.threads ?? '',
                memory: String(server.memory),
                swap: String(server.swap),
                disk: String(server.disk),
                io: String(server.io),
                oom_disabled: server.oom_disabled ? 1 : 0,
                database_limit: server.database_limit?.toString() ?? '',
                allocation_limit: server.allocation_limit?.toString() ?? '',
                backup_limit: server.backup_limit?.toString() ?? '',
                subdomain_limit: server.subdomain_limit?.toString() ?? '',
                add_allocations: [],
                remove_allocations: [],
            });
        }
    }, [data]);

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-servers', error });
        } else {
            clearFlashes('admin-servers');
        }
    }, [error, clearAndAddHttpError, clearFlashes]);

    const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const onMultiChange = (key: 'add_allocations' | 'remove_allocations', select: HTMLSelectElement) => {
        const values = Array.from(select.selectedOptions).map((option) => Number(option.value));
        updateField(key, values);
    };

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        setSaving(true);
        clearFlashes('admin-servers');

        updateServerBuild(serverId, {
            allocation_id: form.allocation_id,
            cpu: Number(form.cpu),
            threads: form.threads || null,
            memory: Number(form.memory),
            swap: Number(form.swap),
            disk: Number(form.disk),
            io: Number(form.io),
            oom_disabled: form.oom_disabled,
            database_limit: form.database_limit ? Number(form.database_limit) : null,
            allocation_limit: form.allocation_limit ? Number(form.allocation_limit) : null,
            backup_limit: form.backup_limit ? Number(form.backup_limit) : null,
            subdomain_limit: form.subdomain_limit ? Number(form.subdomain_limit) : null,
            add_allocations: form.add_allocations,
            remove_allocations: form.remove_allocations,
        })
            .then((response) => {
                addFlash({
                    key: 'admin-servers',
                    type: 'success',
                    title: 'Build saved',
                    message: response.message,
                });
                mutate();
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-servers', error: submitError });
            })
            .finally(() => setSaving(false));
    };

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    if (!data) {
        return <p className="text-sm text-muted-foreground">Unable to load build configuration.</p>;
    }

    const serverName = serverData?.server.name ?? `Server #${data.server.id}`;

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="overflow-hidden rounded-md border border-border bg-card px-5 py-4">
                <h2 className="text-base font-semibold text-foreground">{serverName}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Build configuration · <code>#{data.server.id}</code>
                </p>
            </div>

            <SettingsSection title="Resources" description="CPU, memory, disk, and IO limits for this server.">
                <SettingRow label="CPU limit" htmlFor="cpu" description="Percentage of host CPU. 0 = unlimited.">
                    <UnitInput id="cpu" value={form.cpu} onChange={(value) => updateField('cpu', value)} unit="%" />
                </SettingRow>
                <SettingRow
                    label="CPU pinning"
                    htmlFor="threads"
                    description="Optional thread pinning, e.g. 0,1,2,3."
                >
                    <input
                        id="threads"
                        className={fieldClass}
                        value={form.threads}
                        onChange={(e) => updateField('threads', e.target.value)}
                    />
                </SettingRow>
                <SettingRow label="Memory" htmlFor="memory" description="Allocated RAM for the container.">
                    <UnitInput
                        id="memory"
                        value={form.memory}
                        onChange={(value) => updateField('memory', value)}
                        unit="MiB"
                    />
                </SettingRow>
                <SettingRow label="Swap" htmlFor="swap" description="-1 for unlimited, 0 to disable.">
                    <UnitInput id="swap" value={form.swap} onChange={(value) => updateField('swap', value)} unit="MiB" />
                </SettingRow>
                <SettingRow label="Disk" htmlFor="disk" description="Disk space limit. 0 = unlimited.">
                    <UnitInput id="disk" value={form.disk} onChange={(value) => updateField('disk', value)} unit="MiB" />
                </SettingRow>
                <SettingRow label="Block IO" htmlFor="io" description="Relative block IO weight (10–1000).">
                    <input
                        id="io"
                        className={fieldClass}
                        value={form.io}
                        onChange={(e) => updateField('io', e.target.value)}
                    />
                </SettingRow>
                <SettingRow label="OOM killer" description="Kill the process if memory exceeds the limit.">
                    <SegmentedControl
                        value={form.oom_disabled}
                        options={[
                            { value: 0, label: 'Enabled' },
                            { value: 1, label: 'Disabled' },
                        ]}
                        onChange={(value) => updateField('oom_disabled', value)}
                    />
                </SettingRow>
            </SettingsSection>

            <SettingsSection title="Feature limits" description="Caps on databases, ports, backups, and subdomains.">
                <SettingRow
                    label="Database limit"
                    htmlFor="database_limit"
                    description="Max databases this server can create."
                >
                    <input
                        id="database_limit"
                        className={fieldClass}
                        value={form.database_limit}
                        onChange={(e) => updateField('database_limit', e.target.value)}
                    />
                </SettingRow>
                <SettingRow
                    label="Allocation limit"
                    htmlFor="allocation_limit"
                    description="Max additional network ports."
                >
                    <input
                        id="allocation_limit"
                        className={fieldClass}
                        value={form.allocation_limit}
                        onChange={(e) => updateField('allocation_limit', e.target.value)}
                    />
                </SettingRow>
                <SettingRow label="Backup limit" htmlFor="backup_limit" description="Max backups allowed.">
                    <input
                        id="backup_limit"
                        className={fieldClass}
                        value={form.backup_limit}
                        onChange={(e) => updateField('backup_limit', e.target.value)}
                    />
                </SettingRow>
                <SettingRow
                    label="Subdomain limit"
                    htmlFor="subdomain_limit"
                    description="Max subdomains this server can create."
                >
                    <input
                        id="subdomain_limit"
                        className={fieldClass}
                        value={form.subdomain_limit}
                        onChange={(e) => updateField('subdomain_limit', e.target.value)}
                    />
                </SettingRow>
            </SettingsSection>

            <SettingsSection title="Allocations" description="Primary game port and additional network assignments.">
                <SettingRow label="Game port" htmlFor="allocation-id" description="Default connection allocation.">
                    <select
                        id="allocation-id"
                        className={selectClass}
                        value={form.allocation_id}
                        onChange={(e) => updateField('allocation_id', Number(e.target.value))}
                    >
                        {data.assigned_allocations.map((allocation) => (
                            <option key={allocation.id} value={allocation.id}>
                                {allocation.label}
                            </option>
                        ))}
                    </select>
                </SettingRow>
                <SettingRow
                    label="Assign ports"
                    htmlFor="add-allocations"
                    description="Hold Cmd/Ctrl to select multiple unassigned ports."
                    wide
                >
                    <select
                        id="add-allocations"
                        className={selectClass}
                        multiple
                        size={6}
                        onChange={(e) => onMultiChange('add_allocations', e.currentTarget)}
                    >
                        {data.unassigned_allocations.map((allocation) => (
                            <option key={allocation.id} value={allocation.id}>
                                {allocation.label}
                            </option>
                        ))}
                    </select>
                </SettingRow>
                <SettingRow
                    label="Remove ports"
                    htmlFor="remove-allocations"
                    description="Hold Cmd/Ctrl to select ports to unassign."
                    wide
                >
                    <select
                        id="remove-allocations"
                        className={selectClass}
                        multiple
                        size={6}
                        onChange={(e) => onMultiChange('remove_allocations', e.currentTarget)}
                    >
                        {data.assigned_allocations.map((allocation) => (
                            <option key={allocation.id} value={allocation.id}>
                                {allocation.label}
                            </option>
                        ))}
                    </select>
                </SettingRow>
            </SettingsSection>

            <SettingsFooter>
                <Link to={`${adminPreviewBasePath}/servers/${serverId}`} className="no-underline">
                    <Button type="button" variant="outline" disabled={saving}>
                        Cancel
                    </Button>
                </Link>
                <Button type="submit" disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save changes'}
                </Button>
            </SettingsFooter>
        </form>
    );
};
