import React, { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { Link, useHistory } from 'react-router-dom';
import {
    ArrowLeft,
    ArrowRight,
    Cpu,
    Egg,
    Network,
    Rocket,
    Save,
    Server,
    Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import {
    createServer,
    getServerCreateMeta,
    searchUsers,
    StartupEgg,
} from '@/api/admin/servers';
import { fieldClass, selectClass, textareaClass } from '@/components/admin-preview/settings/fieldClass';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';
import { cn } from '@/lib/utils';

const STEPS = [
    { id: 1, label: 'General', desc: 'Name, owner & description', icon: Server },
    { id: 2, label: 'Deployment', desc: 'Node & allocations', icon: Network },
    { id: 3, label: 'Resources', desc: 'CPU, memory & limits', icon: Cpu },
    { id: 4, label: 'Software', desc: 'Nest, egg & image', icon: Egg },
    { id: 5, label: 'Launch', desc: 'Startup & variables', icon: Rocket },
] as const;

const defaultForm = {
    name: '',
    owner_id: 0,
    owner_label: '',
    description: '',
    start_on_completion: true,
    node_id: 0,
    allocation_id: 0,
    allocation_additional: [] as number[],
    cpu: '0',
    memory: '',
    disk: '',
    swap: '0',
    database_limit: '0',
    allocation_limit: '0',
    backup_limit: '0',
    subdomain_limit: '0',
    threads: '',
    io: '500',
    oom_killer_enabled: true,
    nest_id: 0,
    egg_id: 0,
    image: '',
    custom_image: '',
    skip_scripts: false,
    startup: '',
    environment: {} as Record<string, string>,
};

const buildEnvironmentDefaults = (egg: StartupEgg | null): Record<string, string> => {
    if (!egg) return {};

    return egg.variables.reduce<Record<string, string>>((accumulator, variable) => {
        accumulator[variable.env_variable] = variable.default_value ?? '';
        return accumulator;
    }, {});
};

export default () => {
    const history = useHistory();
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data, error, isValidating } = useSWR('admin-servers-create', getServerCreateMeta);
    const [step, setStep] = useState(1);
    const [form, setForm] = useState(defaultForm);
    const [ownerQuery, setOwnerQuery] = useState('');
    const [ownerResults, setOwnerResults] = useState<
        { id: number; email: string; username: string; name_first: string; name_last: string }[]
    >([]);
    const [saving, setSaving] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-servers', error });
        } else {
            clearFlashes('admin-servers');
        }
    }, [error, clearAndAddHttpError, clearFlashes]);

    useEffect(() => {
        if (!data?.has_nodes) return;

        const firstNode = data.locations.flatMap((location) => location.nodes)[0];
        const firstNest = data.nests[0];
        const firstEgg = firstNest?.eggs[0] ?? null;
        const nodeOption = data.node_options.find((node) => node.id === (firstNode?.id ?? 0));
        const firstAllocation = nodeOption?.allocations[0]?.id ?? 0;

        setForm((current) => {
            if (current.node_id) return current;

            return {
                ...current,
                node_id: firstNode?.id ?? 0,
                allocation_id: firstAllocation,
                nest_id: firstNest?.id ?? 0,
                egg_id: firstEgg?.id ?? 0,
                startup: firstEgg?.startup ?? firstNest?.startup ?? '',
                environment: buildEnvironmentDefaults(firstEgg ?? null),
                image: firstEgg ? Object.values(firstEgg.docker_images)[0] ?? '' : '',
            };
        });
    }, [data]);

    useEffect(() => {
        if (ownerQuery.trim().length < 2) {
            setOwnerResults([]);
            return;
        }

        const timeout = window.setTimeout(() => {
            searchUsers(ownerQuery.trim())
                .then((response) => setOwnerResults(response.users))
                .catch(() => setOwnerResults([]));
        }, 250);

        return () => window.clearTimeout(timeout);
    }, [ownerQuery]);

    const selectedNode = useMemo(
        () => data?.node_options.find((node) => node.id === form.node_id) ?? null,
        [data, form.node_id]
    );

    const selectedNest = useMemo(
        () => data?.nests.find((nest) => nest.id === form.nest_id) ?? null,
        [data, form.nest_id]
    );

    const selectedEgg: StartupEgg | null = useMemo(
        () => selectedNest?.eggs.find((egg) => egg.id === form.egg_id) ?? null,
        [selectedNest, form.egg_id]
    );

    const dockerOptions = useMemo(() => {
        if (!selectedEgg) return [];

        return Object.entries(selectedEgg.docker_images).map(([label, value]) => ({
            label,
            value,
        }));
    }, [selectedEgg]);

    const defaultStartup = selectedEgg?.startup || selectedNest?.startup || 'Startup not defined';

    const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const onNodeChange = (nodeId: number) => {
        const nodeOption = data?.node_options.find((node) => node.id === nodeId);
        const firstAllocation = nodeOption?.allocations[0]?.id ?? 0;

        setForm((current) => ({
            ...current,
            node_id: nodeId,
            allocation_id: firstAllocation,
            allocation_additional: [],
        }));
    };

    const onNestChange = (nestId: number) => {
        const nest = data?.nests.find((item) => item.id === nestId);
        const nextEgg = nest?.eggs[0] ?? null;

        setForm((current) => ({
            ...current,
            nest_id: nestId,
            egg_id: nextEgg?.id ?? 0,
            image: nextEgg ? Object.values(nextEgg.docker_images)[0] ?? '' : '',
            custom_image: '',
            startup: nextEgg?.startup ?? nest?.startup ?? '',
            environment: buildEnvironmentDefaults(nextEgg),
        }));
    };

    const onEggChange = (eggId: number) => {
        const egg = selectedNest?.eggs.find((item) => item.id === eggId) ?? null;

        setForm((current) => ({
            ...current,
            egg_id: eggId,
            image: egg ? Object.values(egg.docker_images)[0] ?? '' : '',
            custom_image: '',
            startup: egg?.startup ?? selectedNest?.startup ?? '',
            environment: buildEnvironmentDefaults(egg),
        }));
    };

    const validateStep = (currentStep: number): boolean => {
        switch (currentStep) {
            case 1:
                return Boolean(form.name.trim() && form.owner_id);
            case 2:
                return Boolean(form.node_id && form.allocation_id);
            case 3:
                return Boolean(form.memory.trim() && form.disk.trim());
            case 4:
                return Boolean(form.nest_id && form.egg_id && (form.image || form.custom_image.trim()));
            case 5:
                return Boolean(form.startup.trim());
            default:
                return true;
        }
    };

    const onNext = () => {
        if (!validateStep(step)) return;
        setStep((current) => Math.min(5, current + 1));
    };

    const onBack = () => setStep((current) => Math.max(1, current - 1));

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!validateStep(5)) return;

        setSaving(true);
        clearFlashes('admin-servers');

        createServer({
            name: form.name.trim(),
            owner_id: form.owner_id,
            description: form.description.trim() || null,
            start_on_completion: form.start_on_completion,
            node_id: form.node_id,
            allocation_id: form.allocation_id,
            allocation_additional: form.allocation_additional,
            cpu: Number(form.cpu),
            memory: Number(form.memory),
            disk: Number(form.disk),
            swap: Number(form.swap),
            io: Number(form.io),
            threads: form.threads.trim() || null,
            oom_disabled: !form.oom_killer_enabled,
            database_limit: Number(form.database_limit),
            allocation_limit: Number(form.allocation_limit),
            backup_limit: Number(form.backup_limit),
            subdomain_limit: Number(form.subdomain_limit),
            nest_id: form.nest_id,
            egg_id: form.egg_id,
            startup: form.startup,
            image: form.custom_image.trim() || form.image,
            custom_image: form.custom_image.trim() || undefined,
            skip_scripts: form.skip_scripts,
            environment: form.environment,
        })
            .then((response) => {
                addFlash({
                    key: 'admin-servers',
                    type: 'success',
                    title: 'Server created',
                    message: response.message,
                });
                history.push(`${adminPreviewBasePath}/servers/${response.server.id}`);
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
        return <p className="text-sm text-muted-foreground">Unable to load server creation form.</p>;
    }

    if (!data.has_locations) {
        return (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
                <p className="text-base font-medium text-foreground">A location is required</p>
                <p className="mt-1 text-sm text-muted-foreground">Create a location before deploying a server.</p>
                <Link to={`${adminPreviewBasePath}/locations`} className="mt-5 inline-block no-underline">
                    <Button>Go to locations</Button>
                </Link>
            </div>
        );
    }

    if (!data.has_nodes) {
        return (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
                <p className="text-base font-medium text-foreground">A node is required</p>
                <p className="mt-1 text-sm text-muted-foreground">
                    Add a node with allocations before creating a server.
                </p>
                <Link to={`${adminPreviewBasePath}/nodes/new`} className="mt-5 inline-block no-underline">
                    <Button>Create node</Button>
                </Link>
            </div>
        );
    }

    const additionalAllocations = selectedNode?.allocations.filter(
        (allocation) => allocation.id !== form.allocation_id
    );

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            <div className="rounded-lg border border-border bg-card lg:col-span-1">
                <div className="border-b border-border px-5 py-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Setup progress</p>
                    <p className="mt-1 text-sm text-muted-foreground">Step {step} of 5</p>
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
                        <div className="h-full bg-primary transition-all" style={{ width: `${(step / 5) * 100}%` }} />
                    </div>
                </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-4 lg:col-span-3">
                {step === 1 && (
                    <div className="rounded-lg border border-border bg-card">
                        <div className="border-b border-border px-5 py-4">
                            <h2 className="text-base font-semibold text-foreground">General information</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Who owns this server and how should it appear in the panel?
                            </p>
                        </div>
                        <div className="space-y-5 p-5">
                            <div className="space-y-2">
                                <Label htmlFor="server-name">Server name</Label>
                                <input
                                    id="server-name"
                                    className={fieldClass}
                                    value={form.name}
                                    onChange={(event) => updateField('name', event.target.value)}
                                    placeholder="My Minecraft Server"
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    Allowed characters: <code>a-z A-Z 0-9 _ - .</code> and spaces.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="owner-search">Server owner</Label>
                                <input
                                    id="owner-search"
                                    className={fieldClass}
                                    value={ownerQuery || form.owner_label}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        setOwnerQuery(value);
                                        updateField('owner_label', value);
                                    }}
                                    placeholder="Search by email..."
                                    required
                                />
                                {ownerResults.length > 0 && (
                                    <div className="overflow-hidden rounded-md border border-border bg-background">
                                        {ownerResults.map((user) => (
                                            <button
                                                key={user.id}
                                                type="button"
                                                className="block w-full border-b border-border px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted"
                                                onClick={() => {
                                                    updateField('owner_id', user.id);
                                                    updateField('owner_label', `${user.email} (${user.username})`);
                                                    setOwnerQuery('');
                                                    setOwnerResults([]);
                                                }}
                                            >
                                                <span className="font-medium text-foreground">
                                                    {user.name_first} {user.name_last}
                                                </span>
                                                <span className="ml-2 text-muted-foreground">{user.email}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="server-description">Description (optional)</Label>
                                <textarea
                                    id="server-description"
                                    className={textareaClass}
                                    rows={2}
                                    value={form.description}
                                    onChange={(event) => updateField('description', event.target.value)}
                                    placeholder="Short note for admins or the owner"
                                />
                            </div>
                            <label className="flex items-start gap-3 rounded-md border border-border bg-background px-4 py-3">
                                <input
                                    type="checkbox"
                                    className="mt-1"
                                    checked={form.start_on_completion}
                                    onChange={(event) => updateField('start_on_completion', event.target.checked)}
                                />
                                <span>
                                    <span className="block text-sm font-medium text-foreground">
                                        Start server after installation
                                    </span>
                                    <span className="block text-xs text-muted-foreground">
                                        Power on automatically once Wings finishes installing the server.
                                    </span>
                                </span>
                            </label>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="rounded-lg border border-border bg-card">
                        <div className="border-b border-border px-5 py-4">
                            <h2 className="text-base font-semibold text-foreground">Deployment</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Choose where the server runs and which address players connect to.
                            </p>
                        </div>
                        <div className="space-y-5 p-5">
                            <div className="space-y-2">
                                <Label htmlFor="node-id">Node</Label>
                                <select
                                    id="node-id"
                                    className={selectClass}
                                    value={form.node_id}
                                    onChange={(event) => onNodeChange(Number(event.target.value))}
                                    required
                                >
                                    {data.locations.map((location) => (
                                        <optgroup
                                            key={location.id}
                                            label={`${location.long || location.short} (${location.short})`}
                                        >
                                            {location.nodes.map((node) => (
                                                <option key={node.id} value={node.id}>
                                                    {node.name}
                                                </option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="allocation-id">Primary allocation</Label>
                                    <select
                                        id="allocation-id"
                                        className={selectClass}
                                        value={form.allocation_id}
                                        onChange={(event) => {
                                            const allocationId = Number(event.target.value);
                                            setForm((current) => ({
                                                ...current,
                                                allocation_id: allocationId,
                                                allocation_additional: current.allocation_additional.filter(
                                                    (id) => id !== allocationId
                                                ),
                                            }));
                                        }}
                                        required
                                    >
                                        {selectedNode?.allocations.map((allocation) => (
                                            <option key={allocation.id} value={allocation.id}>
                                                {allocation.text}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="allocation-additional">Additional allocations (optional)</Label>
                                    <select
                                        id="allocation-additional"
                                        className={selectClass}
                                        multiple
                                        size={5}
                                        value={form.allocation_additional.map(String)}
                                        onChange={(event) => {
                                            const values = Array.from(event.target.selectedOptions).map((option) =>
                                                Number(option.value)
                                            );
                                            updateField('allocation_additional', values);
                                        }}
                                    >
                                        {additionalAllocations?.map((allocation) => (
                                            <option key={allocation.id} value={allocation.id}>
                                                {allocation.text}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-muted-foreground">
                                        Hold Ctrl/Cmd to select multiple extra ports.
                                    </p>
                                </div>
                            </div>
                            {!selectedNode?.allocations.length && (
                                <p className="text-sm text-amber-400">
                                    This node has no free allocations. Add allocations before creating a server.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="rounded-lg border border-border bg-card">
                        <div className="border-b border-border px-5 py-4">
                            <h2 className="text-base font-semibold text-foreground">Resources & limits</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Define how much hardware this server may use and what features the owner can create.
                            </p>
                        </div>
                        <div className="space-y-6 p-5">
                            <div>
                                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Hardware
                                </p>
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="cpu">CPU limit</Label>
                                        <div className="flex">
                                            <input
                                                id="cpu"
                                                className={cn(fieldClass, 'rounded-r-none')}
                                                value={form.cpu}
                                                onChange={(event) => updateField('cpu', event.target.value)}
                                            />
                                            <span className="inline-flex items-center rounded-r-md border border-l-0 border-border bg-muted px-3 text-sm text-muted-foreground">
                                                %
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            <code>0</code> = unlimited. 100% ≈ one thread.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="memory">Memory</Label>
                                        <div className="flex">
                                            <input
                                                id="memory"
                                                className={cn(fieldClass, 'rounded-r-none')}
                                                value={form.memory}
                                                onChange={(event) => updateField('memory', event.target.value)}
                                                required
                                            />
                                            <span className="inline-flex items-center rounded-r-md border border-l-0 border-border bg-muted px-3 text-sm text-muted-foreground">
                                                MiB
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="disk">Disk space</Label>
                                        <div className="flex">
                                            <input
                                                id="disk"
                                                className={cn(fieldClass, 'rounded-r-none')}
                                                value={form.disk}
                                                onChange={(event) => updateField('disk', event.target.value)}
                                                required
                                            />
                                            <span className="inline-flex items-center rounded-r-md border border-l-0 border-border bg-muted px-3 text-sm text-muted-foreground">
                                                MiB
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="swap">Swap</Label>
                                        <div className="flex">
                                            <input
                                                id="swap"
                                                className={cn(fieldClass, 'rounded-r-none')}
                                                value={form.swap}
                                                onChange={(event) => updateField('swap', event.target.value)}
                                            />
                                            <span className="inline-flex items-center rounded-r-md border border-l-0 border-border bg-muted px-3 text-sm text-muted-foreground">
                                                MiB
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            <code>0</code> disables swap, <code>-1</code> is unlimited.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Feature limits
                                </p>
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                                    {(
                                        [
                                            ['database_limit', 'Databases'],
                                            ['allocation_limit', 'Allocations'],
                                            ['backup_limit', 'Backups'],
                                            ['subdomain_limit', 'Subdomains'],
                                        ] as const
                                    ).map(([key, label]) => (
                                        <div key={key} className="space-y-2">
                                            <Label htmlFor={key}>{label}</Label>
                                            <input
                                                id={key}
                                                className={fieldClass}
                                                value={form[key]}
                                                onChange={(event) => updateField(key, event.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-md border border-border">
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-foreground"
                                    onClick={() => setShowAdvanced((current) => !current)}
                                >
                                    <Settings className="h-4 w-4 text-muted-foreground" />
                                    Advanced resource options
                                </button>
                                {showAdvanced && (
                                    <div className="space-y-5 border-t border-border p-5">
                                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="threads">CPU pinning</Label>
                                                <input
                                                    id="threads"
                                                    className={fieldClass}
                                                    value={form.threads}
                                                    onChange={(event) => updateField('threads', event.target.value)}
                                                    placeholder="e.g. 0,1,3"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="io">Block IO weight</Label>
                                                <input
                                                    id="io"
                                                    className={fieldClass}
                                                    value={form.io}
                                                    onChange={(event) => updateField('io', event.target.value)}
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Value between <code>10</code> and <code>1000</code>.
                                                </p>
                                            </div>
                                        </div>
                                        <label className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={form.oom_killer_enabled}
                                                onChange={(event) =>
                                                    updateField('oom_killer_enabled', event.target.checked)
                                                }
                                            />
                                            Enable OOM killer
                                        </label>
                                        <p className="text-xs text-muted-foreground">
                                            Stops the server if it exceeds the memory limit.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="rounded-lg border border-border bg-card">
                        <div className="border-b border-border px-5 py-4">
                            <h2 className="text-base font-semibold text-foreground">Software</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Pick the service type and container image for this server.
                            </p>
                        </div>
                        <div className="space-y-5 p-5">
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="nest-id">Nest</Label>
                                    <select
                                        id="nest-id"
                                        className={selectClass}
                                        value={form.nest_id}
                                        onChange={(event) => onNestChange(Number(event.target.value))}
                                        required
                                    >
                                        {data.nests.map((nest) => (
                                            <option key={nest.id} value={nest.id}>
                                                {nest.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="egg-id">Egg</Label>
                                    <select
                                        id="egg-id"
                                        className={selectClass}
                                        value={form.egg_id}
                                        onChange={(event) => onEggChange(Number(event.target.value))}
                                        required
                                    >
                                        {selectedNest?.eggs.map((egg) => (
                                            <option key={egg.id} value={egg.id}>
                                                {egg.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="docker-image">Docker image</Label>
                                <select
                                    id="docker-image"
                                    className={selectClass}
                                    value={form.image}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        setForm((current) => ({
                                            ...current,
                                            image: value,
                                            custom_image: value ? '' : current.custom_image,
                                        }));
                                    }}
                                >
                                    <option value="">Select image...</option>
                                    {dockerOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label} ({option.value})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="custom-image">Custom image</Label>
                                <input
                                    id="custom-image"
                                    className={fieldClass}
                                    value={form.custom_image}
                                    placeholder="Or enter a custom image..."
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        setForm((current) => ({
                                            ...current,
                                            custom_image: value,
                                            image: value ? '' : current.image,
                                        }));
                                    }}
                                />
                            </div>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={form.skip_scripts}
                                    onChange={(event) => updateField('skip_scripts', event.target.checked)}
                                />
                                Skip egg install script
                            </label>
                        </div>
                    </div>
                )}

                {step === 5 && (
                    <div className="space-y-4">
                        <div className="rounded-lg border border-border bg-card">
                            <div className="border-b border-border px-5 py-4">
                                <h2 className="text-base font-semibold text-foreground">Launch configuration</h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Set the startup command and service variables before deploying.
                                </p>
                            </div>
                            <div className="space-y-4 p-5">
                                <div className="space-y-2">
                                    <Label htmlFor="startup">Startup command</Label>
                                    <input
                                        id="startup"
                                        className={fieldClass}
                                        value={form.startup}
                                        onChange={(event) => updateField('startup', event.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="default-startup">Default service start command</Label>
                                    <input
                                        id="default-startup"
                                        className={fieldClass}
                                        value={defaultStartup}
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>

                        {selectedEgg && selectedEgg.variables.length > 0 && (
                            <div className="space-y-4">
                                {selectedEgg.variables.map((variable) => (
                                    <div key={variable.env_variable} className="rounded-lg border border-border bg-card">
                                        <div className="border-b border-border px-5 py-4">
                                            <h3 className="text-sm font-semibold text-foreground">
                                                {variable.required && (
                                                    <span className="mr-2 rounded-full bg-destructive/15 px-2 py-0.5 text-xs text-destructive">
                                                        Required
                                                    </span>
                                                )}
                                                {variable.name}
                                            </h3>
                                        </div>
                                        <div className="space-y-2 p-5">
                                            <input
                                                className={fieldClass}
                                                value={form.environment[variable.env_variable] ?? ''}
                                                onChange={(event) => {
                                                    const value = event.target.value;
                                                    setForm((current) => ({
                                                        ...current,
                                                        environment: {
                                                            ...current.environment,
                                                            [variable.env_variable]: value,
                                                        },
                                                    }));
                                                }}
                                            />
                                            <p className="text-xs text-muted-foreground">{variable.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center justify-between rounded-lg border border-border bg-card px-5 py-4">
                    <Button type="button" variant="outline" disabled={step === 1 || saving} onClick={onBack}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <div className="flex gap-2">
                        <Link to={`${adminPreviewBasePath}/servers`} className="no-underline">
                            <Button type="button" variant="outline" disabled={saving}>
                                Cancel
                            </Button>
                        </Link>
                        {step < 5 ? (
                            <Button type="button" disabled={!validateStep(step)} onClick={onNext}>
                                Continue
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button type="submit" disabled={saving || !validateStep(5)}>
                                <Save className="mr-2 h-4 w-4" />
                                {saving ? 'Creating...' : 'Create server'}
                            </Button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
};
