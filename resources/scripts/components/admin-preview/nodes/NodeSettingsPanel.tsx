import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useParams } from 'react-router-dom';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { getNodeSettings, updateNode } from '@/api/admin/nodes';
import { fieldClass, selectClass, textareaClass } from '@/components/admin-preview/settings/fieldClass';

export default () => {
    const { id } = useParams<{ id: string }>();
    const nodeId = Number(id);
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data, error, isValidating, mutate } = useSWR(
        Number.isFinite(nodeId) ? `admin-node-settings-${nodeId}` : null,
        () => getNodeSettings(nodeId)
    );
    const [form, setForm] = useState({
        name: '',
        description: '',
        location_id: 0,
        public: 1,
        fqdn: '',
        scheme: 'https' as 'https' | 'http',
        behind_proxy: 0,
        maintenance_mode: 0,
        memory: '',
        memory_overallocate: '',
        disk: '',
        disk_overallocate: '',
        upload_size: '',
        daemonBase: '',
        daemonListen: '',
        daemonSFTP: '',
        reset_secret: false,
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (data?.node) {
            const node = data.node;
            setForm({
                name: node.name,
                description: node.description ?? '',
                location_id: node.location_id,
                public: node.public ? 1 : 0,
                fqdn: node.fqdn,
                scheme: node.scheme,
                behind_proxy: node.behind_proxy ? 1 : 0,
                maintenance_mode: node.maintenance_mode ? 1 : 0,
                memory: String(node.memory),
                memory_overallocate: String(node.memory_overallocate),
                disk: String(node.disk),
                disk_overallocate: String(node.disk_overallocate),
                upload_size: String(node.upload_size),
                daemonBase: node.daemonBase,
                daemonListen: String(node.daemonListen),
                daemonSFTP: String(node.daemonSFTP),
                reset_secret: false,
            });
        }
    }, [data]);

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-nodes', error });
        } else {
            clearFlashes('admin-nodes');
        }
    }, [error]);

    const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        setSaving(true);
        clearFlashes('admin-nodes');

        updateNode(nodeId, form)
            .then((response) => {
                addFlash({
                    key: 'admin-nodes',
                    type: 'success',
                    title: 'Node saved',
                    message: response.message,
                });
                mutate();
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-nodes', error: submitError });
            })
            .finally(() => setSaving(false));
    };

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    if (!data) {
        return <p className="text-sm text-muted-foreground">Unable to load node settings.</p>;
    }

    const panelSecure = data.panel_secure;

    return (
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-6">
                <div className="rounded-lg border border-border bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-foreground">Settings</h2>
                    </div>
                    <div className="space-y-5 p-5">
                        <div className="space-y-2">
                            <Label htmlFor="settings-name">Node name</Label>
                            <input
                                id="settings-name"
                                className={fieldClass}
                                value={form.name}
                                onChange={(e) => updateField('name', e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="settings-description">Description</Label>
                            <textarea
                                id="settings-description"
                                className={textareaClass}
                                value={form.description}
                                onChange={(e) => updateField('description', e.target.value)}
                                rows={4}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="settings-location">Location</Label>
                            <select
                                id="settings-location"
                                className={selectClass}
                                value={form.location_id}
                                onChange={(e) => updateField('location_id', Number(e.target.value))}
                            >
                                {data.locations.map((location) => (
                                    <option key={location.id} value={location.id}>
                                        {location.long || location.short} ({location.short})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Allow automatic allocation</Label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="radio"
                                        checked={form.public === 1}
                                        onChange={() => updateField('public', 1)}
                                    />
                                    Yes
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="radio"
                                        checked={form.public === 0}
                                        onChange={() => updateField('public', 0)}
                                    />
                                    No
                                </label>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="settings-fqdn">Fully qualified domain name</Label>
                            <input
                                id="settings-fqdn"
                                className={fieldClass}
                                value={form.fqdn}
                                onChange={(e) => updateField('fqdn', e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Communicate over SSL</Label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="radio"
                                        checked={form.scheme === 'https'}
                                        onChange={() => updateField('scheme', 'https')}
                                    />
                                    Use SSL connection
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="radio"
                                        checked={form.scheme === 'http'}
                                        disabled={panelSecure}
                                        onChange={() => updateField('scheme', 'http')}
                                    />
                                    Use HTTP connection
                                </label>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Behind proxy</Label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="radio"
                                        checked={form.behind_proxy === 0}
                                        onChange={() => updateField('behind_proxy', 0)}
                                    />
                                    Not behind proxy
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="radio"
                                        checked={form.behind_proxy === 1}
                                        onChange={() => updateField('behind_proxy', 1)}
                                    />
                                    Behind proxy
                                </label>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Maintenance mode</Label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="radio"
                                        checked={form.maintenance_mode === 0}
                                        onChange={() => updateField('maintenance_mode', 0)}
                                    />
                                    Disabled
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="radio"
                                        checked={form.maintenance_mode === 1}
                                        onChange={() => updateField('maintenance_mode', 1)}
                                    />
                                    Enabled
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="rounded-lg border border-border bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-foreground">Allocation limits</h2>
                    </div>
                    <div className="space-y-5 p-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="settings-memory">Total memory</Label>
                                <div className="flex">
                                    <input
                                        id="settings-memory"
                                        className={fieldClass}
                                        value={form.memory}
                                        onChange={(e) => updateField('memory', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="settings-memory-over">Overallocate</Label>
                                <input
                                    id="settings-memory-over"
                                    className={fieldClass}
                                    value={form.memory_overallocate}
                                    onChange={(e) => updateField('memory_overallocate', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="settings-disk">Disk space</Label>
                                <input
                                    id="settings-disk"
                                    className={fieldClass}
                                    value={form.disk}
                                    onChange={(e) => updateField('disk', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="settings-disk-over">Overallocate</Label>
                                <input
                                    id="settings-disk-over"
                                    className={fieldClass}
                                    value={form.disk_overallocate}
                                    onChange={(e) => updateField('disk_overallocate', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border border-border bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-foreground">General configuration</h2>
                    </div>
                    <div className="space-y-5 p-5">
                        <div className="space-y-2">
                            <Label htmlFor="settings-upload">Maximum web upload filesize</Label>
                            <input
                                id="settings-upload"
                                className={fieldClass}
                                value={form.upload_size}
                                onChange={(e) => updateField('upload_size', e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="settings-daemon-listen">Daemon port</Label>
                                <input
                                    id="settings-daemon-listen"
                                    className={fieldClass}
                                    value={form.daemonListen}
                                    onChange={(e) => updateField('daemonListen', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="settings-daemon-sftp">Daemon SFTP port</Label>
                                <input
                                    id="settings-daemon-sftp"
                                    className={fieldClass}
                                    value={form.daemonSFTP}
                                    onChange={(e) => updateField('daemonSFTP', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="settings-daemon-base">Server files directory</Label>
                            <input
                                id="settings-daemon-base"
                                className={fieldClass}
                                value={form.daemonBase}
                                onChange={(e) => updateField('daemonBase', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border border-border bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-foreground">Save settings</h2>
                    </div>
                    <div className="space-y-4 p-5">
                        <label className="flex items-start gap-3 text-sm">
                            <input
                                type="checkbox"
                                className="mt-1"
                                checked={form.reset_secret}
                                onChange={(e) => updateField('reset_secret', e.target.checked)}
                            />
                            <span>
                                <span className="font-medium text-foreground">Reset daemon master key</span>
                                <span className="mt-1 block text-xs text-muted-foreground">
                                    Resetting the daemon master key will void any request coming from the old key.
                                </span>
                            </span>
                        </label>
                    </div>
                    <div className="flex justify-end border-t border-border px-5 py-4">
                        <Button type="submit" disabled={saving}>
                            <Save className="mr-2 h-4 w-4" />
                            {saving ? 'Saving...' : 'Save changes'}
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    );
};
