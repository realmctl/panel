import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useParams } from 'react-router-dom';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { getServerBuild, updateServerBuild } from '@/api/admin/servers';
import { fieldClass, selectClass } from '@/components/admin-preview/settings/fieldClass';

export default () => {
    const { id } = useParams<{ id: string }>();
    const serverId = Number(id);
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
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

    return (
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="space-y-6 lg:col-span-2">
                <div className="rounded-lg border border-border bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-foreground">Resource management</h2>
                    </div>
                    <div className="space-y-4 p-5">
                        {[
                            ['cpu', 'CPU limit (%)'],
                            ['threads', 'CPU pinning'],
                            ['memory', 'Allocated memory (MiB)'],
                            ['swap', 'Allocated swap (MiB)'],
                            ['disk', 'Disk space limit (MiB)'],
                            ['io', 'Block IO proportion'],
                        ].map(([key, label]) => (
                            <div key={key} className="space-y-2">
                                <Label htmlFor={key}>{label}</Label>
                                <input
                                    id={key}
                                    className={fieldClass}
                                    value={form[key as keyof typeof form] as string}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        updateField(key as keyof typeof form, value as never);
                                    }}
                                />
                            </div>
                        ))}
                        <div className="space-y-2">
                            <Label>OOM killer</Label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="radio"
                                        checked={form.oom_disabled === 0}
                                        onChange={() => updateField('oom_disabled', 0)}
                                    />
                                    Enabled
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="radio"
                                        checked={form.oom_disabled === 1}
                                        onChange={() => updateField('oom_disabled', 1)}
                                    />
                                    Disabled
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-6 lg:col-span-3">
                <div className="rounded-lg border border-border bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-foreground">Application feature limits</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                        {[
                            ['database_limit', 'Database limit'],
                            ['allocation_limit', 'Allocation limit'],
                            ['backup_limit', 'Backup limit'],
                            ['subdomain_limit', 'Subdomain limit'],
                        ].map(([key, label]) => (
                            <div key={key} className="space-y-2">
                                <Label htmlFor={key}>{label}</Label>
                                <input
                                    id={key}
                                    className={fieldClass}
                                    value={form[key as keyof typeof form] as string}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        updateField(key as keyof typeof form, value as never);
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-lg border border-border bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-foreground">Allocation management</h2>
                    </div>
                    <div className="space-y-4 p-5">
                        <div className="space-y-2">
                            <Label htmlFor="allocation-id">Game port</Label>
                            <select
                                id="allocation-id"
                                className={selectClass}
                                value={form.allocation_id}
                                onChange={(event) => updateField('allocation_id', Number(event.target.value))}
                            >
                                {data.assigned_allocations.map((allocation) => (
                                    <option key={allocation.id} value={allocation.id}>
                                        {allocation.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="add-allocations">Assign additional ports</Label>
                            <select
                                id="add-allocations"
                                className={selectClass}
                                multiple
                                size={6}
                                onChange={(event) => onMultiChange('add_allocations', event.currentTarget)}
                            >
                                {data.unassigned_allocations.map((allocation) => (
                                    <option key={allocation.id} value={allocation.id}>
                                        {allocation.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="remove-allocations">Remove additional ports</Label>
                            <select
                                id="remove-allocations"
                                className={selectClass}
                                multiple
                                size={6}
                                onChange={(event) => onMultiChange('remove_allocations', event.currentTarget)}
                            >
                                {data.assigned_allocations.map((allocation) => (
                                    <option key={allocation.id} value={allocation.id}>
                                        {allocation.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end border-t border-border px-5 py-4">
                        <Button type="submit" disabled={saving}>
                            <Save className="mr-2 h-4 w-4" />
                            {saving ? 'Saving...' : 'Save build'}
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    );
};
