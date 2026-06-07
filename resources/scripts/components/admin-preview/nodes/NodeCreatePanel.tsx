import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useHistory } from 'react-router-dom';
import {
    ArrowLeft,
    ArrowRight,
    BarChart3,
    Cloud,
    Globe,
    Lock,
    Network,
    Save,
    Server,
    Settings,
    Shield,
    ShieldOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { createNode, getNodeCreateMeta } from '@/api/admin/nodes';
import { fieldClass, selectClass, textareaClass } from '@/components/admin-preview/settings/fieldClass';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';
import { cn } from '@/lib/utils';

const STEPS = [
    { id: 1, label: 'General', desc: 'Name & location', icon: Server },
    { id: 2, label: 'Connection', desc: 'FQDN, SSL & visibility', icon: Network },
    { id: 3, label: 'Capacity', desc: 'Memory & disk limits', icon: BarChart3 },
    { id: 4, label: 'Daemon', desc: 'Paths & ports', icon: Settings },
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
            <div className="rounded-lg border border-border bg-card p-8 text-center">
                <p className="text-base font-medium text-foreground">A location is required</p>
                <p className="mt-1 text-sm text-muted-foreground">Create a location before adding a node.</p>
                <Link to={`${adminPreviewBasePath}/locations`} className="mt-5 inline-block no-underline">
                    <Button>Go to locations</Button>
                </Link>
            </div>
        );
    }

    const panelSecure = data.panel_secure;

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            <div className="rounded-lg border border-border bg-card lg:col-span-1">
                <div className="border-b border-border px-5 py-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Setup progress</p>
                    <p className="mt-1 text-sm text-muted-foreground">Step {step} of 4</p>
                </div>
                <ul className="space-y-1 p-3">
                    {STEPS.map((item) => {
                        const Icon = item.icon;
                        const isActive = step === item.id;
                        const isComplete = step > item.id;

                        return (
                            <li key={item.id}>
                                <button
                                    type="button"
                                    onClick={() => item.id < step && setStep(item.id)}
                                    disabled={item.id > step}
                                    className={cn(
                                        'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors',
                                        isActive && 'bg-muted text-foreground',
                                        isComplete && 'text-foreground',
                                        !isActive && !isComplete && 'text-muted-foreground'
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                                            isActive && 'bg-primary text-primary-foreground',
                                            isComplete && 'bg-green-500/20 text-green-500',
                                            !isActive && !isComplete && 'bg-muted text-muted-foreground'
                                        )}
                                    >
                                        {isComplete ? '✓' : item.id}
                                    </span>
                                    <span>
                                        <span className="block text-sm font-medium">{item.label}</span>
                                        <span className="block text-xs text-muted-foreground">{item.desc}</span>
                                    </span>
                                    <Icon className="ml-auto h-4 w-4 opacity-50" />
                                </button>
                            </li>
                        );
                    })}
                </ul>
                <div className="px-5 pb-4">
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-primary transition-all" style={{ width: `${(step / 4) * 100}%` }} />
                    </div>
                </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-4 lg:col-span-3">
                {step === 1 && (
                    <div className="rounded-lg border border-border bg-card">
                        <div className="border-b border-border px-5 py-4">
                            <h2 className="text-base font-semibold text-foreground">General information</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Give this node a name and assign it to a location.
                            </p>
                        </div>
                        <div className="space-y-5 p-5">
                            <div className="space-y-2">
                                <Label htmlFor="node-name">Node name</Label>
                                <input
                                    id="node-name"
                                    className={fieldClass}
                                    value={form.name}
                                    onChange={(e) => updateField('name', e.target.value)}
                                    placeholder="eu-west-01"
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    Allowed characters: <code>a-z A-Z 0-9 _ - .</code> and spaces (max 100).
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="node-location">Location</Label>
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
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="node-description">Description (optional)</Label>
                                <textarea
                                    id="node-description"
                                    className={textareaClass}
                                    value={form.description}
                                    onChange={(e) => updateField('description', e.target.value)}
                                    rows={2}
                                    placeholder="e.g. Primary EU hosting node"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="rounded-lg border border-border bg-card">
                        <div className="border-b border-border px-5 py-4">
                            <h2 className="text-base font-semibold text-foreground">Connection settings</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                How the panel reaches Wings and whether the node accepts auto-deployments.
                            </p>
                        </div>
                        <div className="space-y-5 p-5">
                            <div className="space-y-2">
                                <Label htmlFor="node-fqdn">FQDN</Label>
                                <input
                                    id="node-fqdn"
                                    className={cn(fieldClass, 'font-mono')}
                                    value={form.fqdn}
                                    onChange={(e) => updateField('fqdn', e.target.value)}
                                    placeholder="node.example.com"
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    Domain Wings listens on. Use an IP only when SSL is disabled.
                                </p>
                            </div>

                            <div className="rounded-md border border-border bg-muted/30 px-4 py-3">
                                <p className="text-xs text-muted-foreground">Panel connects via</p>
                                <code className="text-sm text-foreground">
                                    {form.scheme}://{form.fqdn || 'node.example.com'}
                                </code>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm font-medium text-foreground">Visibility</p>
                                    <p className="text-xs text-muted-foreground">Controls auto-deployment to this node</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant={form.public === 1 ? 'default' : 'outline'}
                                        onClick={() => updateField('public', 1)}
                                    >
                                        <Globe className="mr-2 h-4 w-4" />
                                        Public
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={form.public === 0 ? 'default' : 'outline'}
                                        onClick={() => updateField('public', 0)}
                                    >
                                        <Lock className="mr-2 h-4 w-4" />
                                        Private
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm font-medium text-foreground">Transport</p>
                                    <p className="text-xs text-muted-foreground">How the panel talks to Wings</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant={form.scheme === 'https' ? 'default' : 'outline'}
                                        onClick={() => updateField('scheme', 'https')}
                                    >
                                        <Shield className="mr-2 h-4 w-4" />
                                        HTTPS
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={form.scheme === 'http' ? 'default' : 'outline'}
                                        disabled={panelSecure}
                                        onClick={() => updateField('scheme', 'http')}
                                    >
                                        <ShieldOff className="mr-2 h-4 w-4" />
                                        HTTP
                                    </Button>
                                </div>
                                {panelSecure && (
                                    <p className="text-xs text-red-500">
                                        Your panel uses HTTPS — this node must use SSL too.
                                    </p>
                                )}
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm font-medium text-foreground">Network path</p>
                                    <p className="text-xs text-muted-foreground">Whether Wings sits behind a reverse proxy</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant={form.behind_proxy === 0 ? 'default' : 'outline'}
                                        onClick={() => updateField('behind_proxy', 0)}
                                    >
                                        <Network className="mr-2 h-4 w-4" />
                                        Direct
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={form.behind_proxy === 1 ? 'default' : 'outline'}
                                        onClick={() => updateField('behind_proxy', 1)}
                                    >
                                        <Cloud className="mr-2 h-4 w-4" />
                                        Proxy
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="rounded-lg border border-border bg-card">
                        <div className="border-b border-border px-5 py-4">
                            <h2 className="text-base font-semibold text-foreground">Capacity</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Set how much memory and disk can be assigned to servers on this node.
                            </p>
                        </div>
                        <div className="space-y-6 p-5">
                            <div>
                                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Memory
                                </p>
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="node-memory">Total memory</Label>
                                        <div className="flex">
                                            <input
                                                id="node-memory"
                                                className={cn(fieldClass, 'rounded-r-none')}
                                                value={form.memory}
                                                onChange={(e) => updateField('memory', e.target.value)}
                                                required
                                            />
                                            <span className="inline-flex items-center rounded-r-md border border-l-0 border-border bg-muted px-3 text-sm text-muted-foreground">
                                                MiB
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="node-memory-over">Memory over-allocation</Label>
                                        <div className="flex">
                                            <input
                                                id="node-memory-over"
                                                className={cn(fieldClass, 'rounded-r-none')}
                                                value={form.memory_overallocate}
                                                onChange={(e) => updateField('memory_overallocate', e.target.value)}
                                                required
                                            />
                                            <span className="inline-flex items-center rounded-r-md border border-l-0 border-border bg-muted px-3 text-sm text-muted-foreground">
                                                %
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Disk
                                </p>
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="node-disk">Total disk space</Label>
                                        <div className="flex">
                                            <input
                                                id="node-disk"
                                                className={cn(fieldClass, 'rounded-r-none')}
                                                value={form.disk}
                                                onChange={(e) => updateField('disk', e.target.value)}
                                                required
                                            />
                                            <span className="inline-flex items-center rounded-r-md border border-l-0 border-border bg-muted px-3 text-sm text-muted-foreground">
                                                MiB
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="node-disk-over">Disk over-allocation</Label>
                                        <div className="flex">
                                            <input
                                                id="node-disk-over"
                                                className={cn(fieldClass, 'rounded-r-none')}
                                                value={form.disk_overallocate}
                                                onChange={(e) => updateField('disk_overallocate', e.target.value)}
                                                required
                                            />
                                            <span className="inline-flex items-center rounded-r-md border border-l-0 border-border bg-muted px-3 text-sm text-muted-foreground">
                                                %
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <p className="mt-2 text-xs text-muted-foreground">
                                    <code>-1</code> disables checks, <code>0</code> blocks overcommit.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="rounded-lg border border-border bg-card">
                        <div className="border-b border-border px-5 py-4">
                            <h2 className="text-base font-semibold text-foreground">Daemon configuration</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Where Wings stores server data and which ports it listens on.
                            </p>
                        </div>
                        <div className="space-y-5 p-5">
                            <div className="space-y-2">
                                <Label htmlFor="node-daemon-base">Server files directory</Label>
                                <input
                                    id="node-daemon-base"
                                    className={cn(fieldClass, 'font-mono')}
                                    value={form.daemonBase}
                                    onChange={(e) => updateField('daemonBase', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="node-daemon-listen">Daemon port</Label>
                                    <input
                                        id="node-daemon-listen"
                                        className={fieldClass}
                                        value={form.daemonListen}
                                        onChange={(e) => updateField('daemonListen', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="node-daemon-sftp">SFTP port</Label>
                                    <input
                                        id="node-daemon-sftp"
                                        className={fieldClass}
                                        value={form.daemonSFTP}
                                        onChange={(e) => updateField('daemonSFTP', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between rounded-lg border border-border bg-card px-5 py-4">
                    <Button type="button" variant="outline" disabled={step === 1 || saving} onClick={onBack}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
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
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button type="submit" disabled={saving || !validateStep(4)}>
                                <Save className="mr-2 h-4 w-4" />
                                {saving ? 'Creating...' : 'Create node'}
                            </Button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
};
