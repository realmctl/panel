import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useHistory } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { createNode, getNodeCreateMeta } from '@/api/admin/nodes';
import { fieldClass, selectClass, textareaClass } from '@/components/admin-preview/settings/fieldClass';
import { SegmentedControl, SettingRow, SettingsSection } from '@/components/admin-preview/settings/settingsLayout';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';
import { cn } from '@/lib/utils';

const STEPS = [
    { id: 1, label: 'General', desc: 'Name & location' },
    { id: 2, label: 'Connection', desc: 'FQDN, SSL & visibility' },
    { id: 3, label: 'Capacity', desc: 'Memory & disk limits' },
    { id: 4, label: 'Daemon', desc: 'Paths & ports' },
] as const;

const defaultForm = {
    name: '',
    description: '',
    location_id: 0,
    fqdn: '',
    scheme: 'https' as 'https' | 'http',
    behind_proxy: 0,
    public: 1,
    memory: '',
    memory_overallocate: '0',
    disk: '',
    disk_overallocate: '0',
    daemonBase: '/var/lib/realm/volumes',
    daemonListen: '8080',
    daemonSFTP: '2022',
};

export default () => {
    const history = useHistory();
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data, error, isValidating } = useSWR('admin-nodes-create', getNodeCreateMeta);
    const [step, setStep] = useState(1);
    const [form, setForm] = useState(defaultForm);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-nodes', error });
        } else {
            clearFlashes('admin-nodes');
        }
    }, [error]);

    useEffect(() => {
        if (data?.locations.length && !form.location_id) {
            setForm((current) => ({ ...current, location_id: data.locations[0].id }));
        }
    }, [data, form.location_id]);

    const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const validateStep = (currentStep: number): boolean => {
        switch (currentStep) {
            case 1:
                return Boolean(form.name.trim() && form.location_id);
            case 2:
                return Boolean(form.fqdn.trim());
            case 3:
                return Boolean(form.memory.trim() && form.disk.trim());
            case 4:
                return Boolean(form.daemonBase.trim() && form.daemonListen.trim() && form.daemonSFTP.trim());
            default:
                return true;
        }
    };

    const onNext = () => {
        if (!validateStep(step)) return;
        setStep((current) => Math.min(4, current + 1));
    };

    const onBack = () => setStep((current) => Math.max(1, current - 1));

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!validateStep(4)) return;

        setSaving(true);
        clearFlashes('admin-nodes');

        createNode(form)
            .then((response) => {
                addFlash({
                    key: 'admin-nodes',
                    type: 'success',
                    title: 'Node created',
                    message: response.message,
                });

                if (response.redirect === 'node') {
                    history.push(`${adminPreviewBasePath}/nodes/${response.node.id}`);
                } else {
                    history.push(`${adminPreviewBasePath}/nodes/${response.node.id}/allocation`);
                }
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
        return <p className="text-sm text-muted-foreground">Unable to load node creation form.</p>;
    }

    if (data.locations.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                A location is required before adding a node.{' '}
                <Link to={`${adminPreviewBasePath}/locations`} className="text-blue-400 no-underline hover:text-blue-300">
                    Go to locations
                </Link>
                .
            </p>
        );
    }

    const panelSecure = data.panel_secure;

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <div className="overflow-hidden rounded-md border border-border bg-card lg:col-span-1">
                <div className="border-b border-border px-5 py-4">
                    <p className="text-sm font-semibold text-foreground">Setup</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Step {step} of 4</p>
                </div>
                <ul className="divide-y divide-border">
                    {STEPS.map((item) => {
                        const isActive = step === item.id;
                        const isComplete = step > item.id;

                        return (
                            <li key={item.id}>
                                <button
                                    type="button"
                                    onClick={() => item.id < step && setStep(item.id)}
                                    disabled={item.id > step}
                                    className={cn(
                                        'flex w-full items-center gap-3 px-5 py-3 text-left transition-colors',
                                        isActive && 'bg-muted/50',
                                        item.id > step && 'cursor-not-allowed opacity-50'
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                                            isActive && 'bg-primary text-primary-foreground',
                                            isComplete && 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-500',
                                            !isActive && !isComplete && 'bg-muted text-muted-foreground'
                                        )}
                                    >
                                        {isComplete ? '✓' : item.id}
                                    </span>
                                    <span>
                                        <span className="block text-sm font-medium text-foreground">{item.label}</span>
                                        <span className="block text-xs text-muted-foreground">{item.desc}</span>
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>

            <form onSubmit={onSubmit} className="space-y-4 lg:col-span-3">
                {step === 1 && (
                    <SettingsSection title="General" description="Name and location for this node.">
                        <SettingRow
                            label="Node name"
                            description="Allowed: a-z, A-Z, 0-9, _, -, . and spaces (max 100)."
                            htmlFor="node-name"
                            wide
                        >
                            <input
                                id="node-name"
                                className={fieldClass}
                                value={form.name}
                                onChange={(e) => updateField('name', e.target.value)}
                                placeholder="eu-west-01"
                                required
                            />
                        </SettingRow>
                        <SettingRow label="Location" description="Geographic or logical grouping." htmlFor="node-location" wide>
                            <select
                                id="node-location"
                                className={selectClass}
                                value={form.location_id}
                                onChange={(e) => updateField('location_id', Number(e.target.value))}
                                required
                            >
                                {data.locations.map((location) => (
                                    <option key={location.id} value={location.id}>
                                        {location.long || location.short} ({location.short})
                                    </option>
                                ))}
                            </select>
                        </SettingRow>
                        <SettingRow label="Description" description="Optional notes." htmlFor="node-description" wide>
                            <textarea
                                id="node-description"
                                className={textareaClass}
                                value={form.description}
                                onChange={(e) => updateField('description', e.target.value)}
                                rows={2}
                                placeholder="Primary EU hosting node"
                            />
                        </SettingRow>
                    </SettingsSection>
                )}

                {step === 2 && (
                    <SettingsSection title="Connection" description="How the panel reaches Wings.">
                        <SettingRow label="FQDN" description="Domain Wings listens on." htmlFor="node-fqdn" wide>
                            <input
                                id="node-fqdn"
                                className={cn(fieldClass, 'font-mono')}
                                value={form.fqdn}
                                onChange={(e) => updateField('fqdn', e.target.value)}
                                placeholder="node.example.com"
                                required
                            />
                        </SettingRow>
                        <SettingRow label="Panel connects via" description="Preview of the connection URL." wide>
                            <code className="block rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
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
                    </SettingsSection>
                )}

                {step === 3 && (
                    <SettingsSection title="Capacity" description="Memory and disk limits for this node.">
                        <SettingRow label="Memory" description="Total assignable and over-allocation %." wide>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex min-w-0">
                                    <input
                                        id="node-memory"
                                        className={cn(fieldClass, 'min-w-0 rounded-r-none')}
                                        value={form.memory}
                                        onChange={(e) => updateField('memory', e.target.value)}
                                        required
                                    />
                                    <span className="inline-flex shrink-0 items-center rounded-r-md border border-l-0 border-border bg-muted px-3 text-sm text-muted-foreground">
                                        MiB
                                    </span>
                                </div>
                                <div className="flex min-w-0">
                                    <input
                                        id="node-memory-over"
                                        className={cn(fieldClass, 'min-w-0 rounded-r-none')}
                                        value={form.memory_overallocate}
                                        onChange={(e) => updateField('memory_overallocate', e.target.value)}
                                        required
                                    />
                                    <span className="inline-flex shrink-0 items-center rounded-r-md border border-l-0 border-border bg-muted px-3 text-sm text-muted-foreground">
                                        %
                                    </span>
                                </div>
                            </div>
                        </SettingRow>
                        <SettingRow label="Disk" description="-1 disables overcommit checks, 0 blocks it." wide>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex min-w-0">
                                    <input
                                        id="node-disk"
                                        className={cn(fieldClass, 'min-w-0 rounded-r-none')}
                                        value={form.disk}
                                        onChange={(e) => updateField('disk', e.target.value)}
                                        required
                                    />
                                    <span className="inline-flex shrink-0 items-center rounded-r-md border border-l-0 border-border bg-muted px-3 text-sm text-muted-foreground">
                                        MiB
                                    </span>
                                </div>
                                <div className="flex min-w-0">
                                    <input
                                        id="node-disk-over"
                                        className={cn(fieldClass, 'min-w-0 rounded-r-none')}
                                        value={form.disk_overallocate}
                                        onChange={(e) => updateField('disk_overallocate', e.target.value)}
                                        required
                                    />
                                    <span className="inline-flex shrink-0 items-center rounded-r-md border border-l-0 border-border bg-muted px-3 text-sm text-muted-foreground">
                                        %
                                    </span>
                                </div>
                            </div>
                        </SettingRow>
                    </SettingsSection>
                )}

                {step === 4 && (
                    <SettingsSection title="Daemon" description="Where Wings stores data and which ports it uses.">
                        <SettingRow
                            label="Server files directory"
                            description="Path on the Wings host."
                            htmlFor="node-daemon-base"
                            wide
                        >
                            <input
                                id="node-daemon-base"
                                className={cn(fieldClass, 'font-mono')}
                                value={form.daemonBase}
                                onChange={(e) => updateField('daemonBase', e.target.value)}
                                required
                            />
                        </SettingRow>
                        <SettingRow label="Ports" description="Daemon and SFTP listen ports." wide>
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    id="node-daemon-listen"
                                    className={fieldClass}
                                    value={form.daemonListen}
                                    onChange={(e) => updateField('daemonListen', e.target.value)}
                                    placeholder="Daemon"
                                    required
                                />
                                <input
                                    id="node-daemon-sftp"
                                    className={fieldClass}
                                    value={form.daemonSFTP}
                                    onChange={(e) => updateField('daemonSFTP', e.target.value)}
                                    placeholder="SFTP"
                                    required
                                />
                            </div>
                        </SettingRow>
                    </SettingsSection>
                )}

                <div className="flex items-center justify-between rounded-md border border-border bg-card px-5 py-4">
                    <Button type="button" variant="outline" disabled={step === 1 || saving} onClick={onBack}>
                        Back
                    </Button>
                    <div className="flex gap-2">
                        <Link to={`${adminPreviewBasePath}/nodes`} className="no-underline">
                            <Button type="button" variant="outline" disabled={saving}>
                                Cancel
                            </Button>
                        </Link>
                        {step < 4 ? (
                            <Button type="button" disabled={!validateStep(step)} onClick={onNext}>
                                Continue
                            </Button>
                        ) : (
                            <Button type="submit" disabled={saving || !validateStep(4)}>
                                {saving ? 'Creating...' : 'Create node'}
                            </Button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
};
