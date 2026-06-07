import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useParams } from 'react-router-dom';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { getNodeSettings, updateNode } from '@/api/admin/nodes';
import { fieldClass, selectClass, textareaClass } from '@/components/admin-preview/settings/fieldClass';
import {
    SegmentedControl,
    SettingRow,
    SettingsFooter,
    SettingsSection,
} from '@/components/admin-preview/settings/settingsLayout';
import { cn } from '@/lib/utils';

const UnitInput = ({
    id,
    value,
    onChange,
    unit,
    className,
}: {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    unit: string;
    className?: string;
}) => (
    <div className={cn('flex min-w-0', className)}>
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
        <form onSubmit={onSubmit} className="space-y-4">
            <SettingsSection title="General" description="Name, location, and notes.">
                <SettingRow label="Node name" description="Display name for this node." htmlFor="settings-name" wide>
                    <input
                        id="settings-name"
                        className={fieldClass}
                        value={form.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        required
                    />
                </SettingRow>
                <SettingRow label="Description" description="Optional notes about this node." htmlFor="settings-description" wide>
                    <textarea
                        id="settings-description"
                        className={textareaClass}
                        value={form.description}
                        onChange={(e) => updateField('description', e.target.value)}
                        rows={2}
                    />
                </SettingRow>
                <SettingRow label="Location" description="Geographic or logical grouping." htmlFor="settings-location" wide>
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
                </SettingRow>
            </SettingsSection>

            <SettingsSection title="Connection" description="How the panel reaches Wings.">
                <SettingRow label="FQDN" description="Domain Wings listens on." htmlFor="settings-fqdn" wide>
                    <input
                        id="settings-fqdn"
                        className={cn(fieldClass, 'font-mono')}
                        value={form.fqdn}
                        onChange={(e) => updateField('fqdn', e.target.value)}
                        required
                    />
                </SettingRow>
                <SettingRow label="Panel connects via" description="Connection URL used by the panel." wide>
                    <code className="block w-full rounded-md border border-border bg-muted/30 px-3 py-2.5 text-sm">
                        {form.scheme}://{form.fqdn || 'node.example.com'}
                    </code>
                </SettingRow>
                <SettingRow label="Visibility" description="Controls auto-deployment to this node." wide>
                    <SegmentedControl
                        value={form.public}
                        onChange={(value) => updateField('public', value as 0 | 1)}
                        options={[
                            { value: 1, label: 'Public' },
                            { value: 0, label: 'Private' },
                        ]}
                    />
                </SettingRow>
                <SettingRow
                    label="Transport"
                    description={
                        panelSecure
                            ? 'Your panel uses HTTPS — this node must use SSL too.'
                            : 'How the panel talks to Wings.'
                    }
                    wide
                >
                    <SegmentedControl
                        value={form.scheme}
                        onChange={(value) => updateField('scheme', value as 'https' | 'http')}
                        options={[
                            { value: 'https', label: 'HTTPS' },
                            { value: 'http', label: 'HTTP', disabled: panelSecure },
                        ]}
                    />
                </SettingRow>
                <SettingRow label="Network path" description="Whether Wings sits behind a reverse proxy." wide>
                    <SegmentedControl
                        value={form.behind_proxy}
                        onChange={(value) => updateField('behind_proxy', value as 0 | 1)}
                        options={[
                            { value: 0, label: 'Direct' },
                            { value: 1, label: 'Proxy' },
                        ]}
                    />
                </SettingRow>
                <SettingRow label="Maintenance" description="Prevent new servers from being deployed." wide>
                    <SegmentedControl
                        value={form.maintenance_mode}
                        onChange={(value) => updateField('maintenance_mode', value as 0 | 1)}
                        options={[
                            { value: 0, label: 'Off' },
                            { value: 1, label: 'On' },
                        ]}
                    />
                </SettingRow>
            </SettingsSection>

            <SettingsSection title="Capacity" description="Memory and disk limits for this node.">
                <SettingRow label="Memory" description="Total assignable and over-allocation %." wide>
                    <div className="grid grid-cols-2 gap-3">
                        <UnitInput
                            id="settings-memory"
                            value={form.memory}
                            onChange={(value) => updateField('memory', value)}
                            unit="MiB"
                        />
                        <UnitInput
                            id="settings-memory-over"
                            value={form.memory_overallocate}
                            onChange={(value) => updateField('memory_overallocate', value)}
                            unit="%"
                        />
                    </div>
                </SettingRow>
                <SettingRow label="Disk" description="-1 disables overcommit checks, 0 blocks it." wide>
                    <div className="grid grid-cols-2 gap-3">
                        <UnitInput
                            id="settings-disk"
                            value={form.disk}
                            onChange={(value) => updateField('disk', value)}
                            unit="MiB"
                        />
                        <UnitInput
                            id="settings-disk-over"
                            value={form.disk_overallocate}
                            onChange={(value) => updateField('disk_overallocate', value)}
                            unit="%"
                        />
                    </div>
                </SettingRow>
            </SettingsSection>

            <SettingsSection title="Daemon" description="Wings paths, ports, and upload limits.">
                <SettingRow
                    label="Max upload size"
                    description="Maximum web upload filesize."
                    htmlFor="settings-upload"
                    wide
                >
                    <UnitInput
                        id="settings-upload"
                        value={form.upload_size}
                        onChange={(value) => updateField('upload_size', value)}
                        unit="MiB"
                    />
                </SettingRow>
                <SettingRow label="Ports" description="Daemon and SFTP listen ports." wide>
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            id="settings-daemon-listen"
                            className={fieldClass}
                            value={form.daemonListen}
                            onChange={(e) => updateField('daemonListen', e.target.value)}
                            placeholder="Daemon"
                        />
                        <input
                            id="settings-daemon-sftp"
                            className={fieldClass}
                            value={form.daemonSFTP}
                            onChange={(e) => updateField('daemonSFTP', e.target.value)}
                            placeholder="SFTP"
                        />
                    </div>
                </SettingRow>
                <SettingRow
                    label="Server files directory"
                    description="Where Wings stores server data."
                    htmlFor="settings-daemon-base"
                    wide
                >
                    <input
                        id="settings-daemon-base"
                        className={cn(fieldClass, 'font-mono')}
                        value={form.daemonBase}
                        onChange={(e) => updateField('daemonBase', e.target.value)}
                    />
                </SettingRow>
            </SettingsSection>

            <SettingsSection title="Advanced" description="Dangerous options — use with care.">
                <SettingRow
                    label="Reset master key"
                    description="Invalidates the current daemon key. Wings must be reconfigured."
                    wide
                >
                    <SegmentedControl
                        value={form.reset_secret}
                        onChange={(value) => updateField('reset_secret', value)}
                        options={[
                            { value: false, label: 'Keep key' },
                            { value: true, label: 'Reset on save' },
                        ]}
                    />
                </SettingRow>
            </SettingsSection>

            <SettingsFooter>
                <Button type="submit" disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save changes'}
                </Button>
            </SettingsFooter>
        </form>
    );
};
