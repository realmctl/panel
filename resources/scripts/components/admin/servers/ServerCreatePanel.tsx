import React, { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { Link, useHistory } from 'react-router-dom';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import {
    createServer,
    getServerCreateMeta,
    searchUsers,
    StartupEgg,
} from '@/api/admin/servers';
import { fieldClass, selectClass, textareaClass } from '@/components/admin/settings/fieldClass';
import {
    SegmentedControl,
    SettingRow,
    SettingsSection,
} from '@/components/admin/settings/settingsLayout';
import { adminBasePath } from '@/routers/adminRoutes';
import { cn } from '@/lib/utils';

const STEPS = [
    { id: 1, label: 'General', desc: 'Name, owner & description' },
    { id: 2, label: 'Deployment', desc: 'Node & allocations' },
    { id: 3, label: 'Resources', desc: 'CPU, memory & limits' },
    { id: 4, label: 'Software', desc: 'Nest, egg & image' },
    { id: 5, label: 'Launch', desc: 'Startup & variables' },
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

const UnitInput = ({
    id,
    value,
    onChange,
    unit,
    required,
}: {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    unit: string;
    required?: boolean;
}) => (
    <div className="flex min-w-0">
        <input
            id={id}
            className={cn(fieldClass, 'min-w-0 rounded-r-none')}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={required}
        />
        <span className="inline-flex shrink-0 items-center rounded-r-md border border-l-0 border-border bg-muted px-3 text-sm text-muted-foreground">
            {unit}
        </span>
    </div>
);

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
        const firstAllocation = nodeOption?.allocations?.[0]?.id ?? 0;

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
                .then((response: any) => setOwnerResults(response.users))
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

    const additionalAllocations = useMemo(
        () =>
            (selectedNode?.allocations ?? []).filter((allocation) => allocation.id !== form.allocation_id),
        [selectedNode, form.allocation_id]
    );

    const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const onNodeChange = (nodeId: number) => {
        const nodeOption = data?.node_options.find((node) => node.id === nodeId);
        const firstAllocation = nodeOption?.allocations?.[0]?.id ?? 0;

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
            .then((response: any) => {
                addFlash({
                    key: 'admin-servers',
                    type: 'success',
                    title: 'Server created',
                    message: response.message,
                });
                history.push(`${adminBasePath}/servers/${response.server.id}`);
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
            <p className="text-sm text-muted-foreground">
                A location is required before creating a server.{' '}
                <Link to={`${adminBasePath}/locations`} className="text-blue-400 no-underline hover:text-blue-300">
                    Go to locations
                </Link>
                .
            </p>
        );
    }

    if (!data.has_nodes) {
        return (
            <p className="text-sm text-muted-foreground">
                A node with free allocations is required.{' '}
                <Link to={`${adminBasePath}/nodes/new`} className="text-blue-400 no-underline hover:text-blue-300">
                    Create a node
                </Link>
                .
            </p>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <div className="overflow-hidden rounded-md border border-border bg-card lg:col-span-1">
                <div className="border-b border-border px-5 py-4">
                    <p className="text-sm font-semibold text-foreground">New server</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Step {step} of 5</p>
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
                    <SettingsSection
                        title="General"
                        description="Who owns this server and how should it appear in the panel?"
                    >
                        <SettingRow
                            label="Server name"
                            htmlFor="server-name"
                            description="Allowed: a-z, A-Z, 0-9, _, -, . and spaces."
                        >
                            <input
                                id="server-name"
                                className={fieldClass}
                                value={form.name}
                                onChange={(event) => updateField('name', event.target.value)}
                                placeholder="My Minecraft Server"
                                required
                            />
                        </SettingRow>
                        <SettingRow
                            label="Owner"
                            htmlFor="owner-search"
                            description="Search by email to assign the server owner."
                        >
                            <div className="space-y-2">
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
                                        <div className="divide-y divide-border">
                                            {ownerResults.map((user) => (
                                                <button
                                                    key={user.id}
                                                    type="button"
                                                    className="block w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/50"
                                                    onClick={() => {
                                                        updateField('owner_id', user.id);
                                                        updateField(
                                                            'owner_label',
                                                            `${user.email} (${user.username})`
                                                        );
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
                                    </div>
                                )}
                            </div>
                        </SettingRow>
                        <SettingRow
                            label="Description"
                            htmlFor="server-description"
                            description="Optional note for admins or the owner."
                            wide
                        >
                            <textarea
                                id="server-description"
                                className={textareaClass}
                                rows={2}
                                value={form.description}
                                onChange={(event) => updateField('description', event.target.value)}
                                placeholder="Short note for admins or the owner"
                            />
                        </SettingRow>
                        <SettingRow
                            label="Auto-start"
                            description="Power on automatically once Wings finishes installing the server."
                        >
                            <SegmentedControl
                                value={form.start_on_completion}
                                options={[
                                    { value: true, label: 'Yes' },
                                    { value: false, label: 'No' },
                                ]}
                                onChange={(value) => updateField('start_on_completion', value)}
                            />
                        </SettingRow>
                    </SettingsSection>
                )}

                {step === 2 && (
                    <SettingsSection
                        title="Deployment"
                        description="Choose where the server runs and which address players connect to."
                    >
                        <SettingRow label="Node" htmlFor="node-id" description="Wings node that hosts this server.">
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
                        </SettingRow>
                        <SettingRow
                            label="Primary allocation"
                            htmlFor="allocation-id"
                            description="Default game port for this server."
                        >
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
                                {(selectedNode?.allocations ?? []).map((allocation) => (
                                    <option key={allocation.id} value={allocation.id}>
                                        {allocation.text}
                                    </option>
                                ))}
                            </select>
                        </SettingRow>
                        <SettingRow
                            label="Additional allocations"
                            htmlFor="allocation-additional"
                            description="Hold Cmd/Ctrl to select multiple extra ports."
                            wide
                        >
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
                                {additionalAllocations.map((allocation) => (
                                    <option key={allocation.id} value={allocation.id}>
                                        {allocation.text}
                                    </option>
                                ))}
                            </select>
                        </SettingRow>
                        {!selectedNode?.allocations?.length && (
                            <p className="px-5 py-4 text-sm text-muted-foreground">
                                This node has no free allocations.{' '}
                                <Link
                                    to={`${adminBasePath}/nodes/${form.node_id}/allocation`}
                                    className="text-blue-400 no-underline hover:text-blue-300"
                                >
                                    Add allocations
                                </Link>
                                .
                            </p>
                        )}
                    </SettingsSection>
                )}

                {step === 3 && (
                    <>
                        <SettingsSection
                            title="Resources"
                            description="CPU, memory, disk, and feature limits for this server."
                        >
                            <SettingRow
                                label="CPU limit"
                                htmlFor="cpu"
                                description="Percentage of host CPU. 0 = unlimited."
                            >
                                <UnitInput
                                    id="cpu"
                                    value={form.cpu}
                                    onChange={(value) => updateField('cpu', value)}
                                    unit="%"
                                />
                            </SettingRow>
                            <SettingRow label="Memory" htmlFor="memory" description="Allocated RAM for the container.">
                                <UnitInput
                                    id="memory"
                                    value={form.memory}
                                    onChange={(value) => updateField('memory', value)}
                                    unit="MiB"
                                    required
                                />
                            </SettingRow>
                            <SettingRow label="Disk" htmlFor="disk" description="Disk space limit. 0 = unlimited.">
                                <UnitInput
                                    id="disk"
                                    value={form.disk}
                                    onChange={(value) => updateField('disk', value)}
                                    unit="MiB"
                                    required
                                />
                            </SettingRow>
                            <SettingRow
                                label="Swap"
                                htmlFor="swap"
                                description="0 disables swap, -1 is unlimited."
                            >
                                <UnitInput
                                    id="swap"
                                    value={form.swap}
                                    onChange={(value) => updateField('swap', value)}
                                    unit="MiB"
                                />
                            </SettingRow>
                            <SettingRow
                                label="Database limit"
                                htmlFor="database_limit"
                                description="Max databases the owner can create."
                            >
                                <input
                                    id="database_limit"
                                    className={fieldClass}
                                    value={form.database_limit}
                                    onChange={(event) => updateField('database_limit', event.target.value)}
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
                                    onChange={(event) => updateField('allocation_limit', event.target.value)}
                                />
                            </SettingRow>
                            <SettingRow label="Backup limit" htmlFor="backup_limit" description="Max backups allowed.">
                                <input
                                    id="backup_limit"
                                    className={fieldClass}
                                    value={form.backup_limit}
                                    onChange={(event) => updateField('backup_limit', event.target.value)}
                                />
                            </SettingRow>
                            <SettingRow
                                label="Subdomain limit"
                                htmlFor="subdomain_limit"
                                description="Max subdomains the owner can create."
                            >
                                <input
                                    id="subdomain_limit"
                                    className={fieldClass}
                                    value={form.subdomain_limit}
                                    onChange={(event) => updateField('subdomain_limit', event.target.value)}
                                />
                            </SettingRow>
                        </SettingsSection>

                        <SettingsSection
                            title="Advanced"
                            description="CPU pinning, block IO, and OOM killer behavior."
                        >
                            <SettingRow
                                label="CPU pinning"
                                htmlFor="threads"
                                description="Optional thread pinning, e.g. 0,1,3."
                            >
                                <input
                                    id="threads"
                                    className={fieldClass}
                                    value={form.threads}
                                    onChange={(event) => updateField('threads', event.target.value)}
                                    placeholder="e.g. 0,1,3"
                                />
                            </SettingRow>
                            <SettingRow
                                label="Block IO"
                                htmlFor="io"
                                description="Relative block IO weight (10–1000)."
                            >
                                <input
                                    id="io"
                                    className={fieldClass}
                                    value={form.io}
                                    onChange={(event) => updateField('io', event.target.value)}
                                />
                            </SettingRow>
                            <SettingRow
                                label="OOM killer"
                                description="Kill the process if memory exceeds the limit."
                            >
                                <SegmentedControl
                                    value={form.oom_killer_enabled}
                                    options={[
                                        { value: true, label: 'Enabled' },
                                        { value: false, label: 'Disabled' },
                                    ]}
                                    onChange={(value) => updateField('oom_killer_enabled', value)}
                                />
                            </SettingRow>
                        </SettingsSection>
                    </>
                )}

                {step === 4 && (
                    <SettingsSection
                        title="Software"
                        description="Service type and container image for this server."
                    >
                        <SettingRow label="Nest" htmlFor="nest-id" description="Service category for this server.">
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
                        </SettingRow>
                        <SettingRow label="Egg" htmlFor="egg-id" description="Server template and default configuration.">
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
                        </SettingRow>
                        <SettingRow label="Docker image" htmlFor="docker-image" description="Select from egg-defined images.">
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
                        </SettingRow>
                        <SettingRow
                            label="Custom image"
                            htmlFor="custom-image"
                            description="Use a custom image instead of the egg default."
                        >
                            <input
                                id="custom-image"
                                className={fieldClass}
                                value={form.custom_image}
                                placeholder="e.g. ghcr.io/org/image:tag"
                                onChange={(event) => {
                                    const value = event.target.value;
                                    setForm((current) => ({
                                        ...current,
                                        custom_image: value,
                                        image: value ? '' : current.image,
                                    }));
                                }}
                            />
                        </SettingRow>
                        <SettingRow label="Install script" description="Run the egg install script on first deploy.">
                            <SegmentedControl
                                value={form.skip_scripts}
                                options={[
                                    { value: false, label: 'Run' },
                                    { value: true, label: 'Skip' },
                                ]}
                                onChange={(value) => updateField('skip_scripts', value)}
                            />
                        </SettingRow>
                    </SettingsSection>
                )}

                {step === 5 && (
                    <>
                        <SettingsSection
                            title="Startup"
                            description="Command run when the server starts."
                        >
                            <SettingRow
                                label="Startup command"
                                htmlFor="startup"
                                description="Override the egg default startup command."
                                wide
                            >
                                <input
                                    id="startup"
                                    className={fieldClass}
                                    value={form.startup}
                                    onChange={(event) => updateField('startup', event.target.value)}
                                    required
                                />
                            </SettingRow>
                            <SettingRow label="Egg default" description="Default command from the selected egg.">
                                <code className="block break-all rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-foreground">
                                    {defaultStartup}
                                </code>
                            </SettingRow>
                        </SettingsSection>

                        {selectedEgg && selectedEgg.variables.length > 0 && (
                            <SettingsSection
                                title="Environment variables"
                                description="Values injected into the container at runtime."
                            >
                                {selectedEgg.variables.map((variable) => (
                                    <SettingRow
                                        key={variable.env_variable}
                                        label={variable.name}
                                        htmlFor={`env-${variable.env_variable}`}
                                        description={`${variable.description} · ${variable.env_variable} · ${variable.rules}${
                                            variable.required ? ' · Required' : ''
                                        }`}
                                        wide
                                    >
                                        <input
                                            id={`env-${variable.env_variable}`}
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
                                    </SettingRow>
                                ))}
                            </SettingsSection>
                        )}
                    </>
                )}

                <div className="flex items-center justify-between rounded-md border border-border bg-card px-5 py-4">
                    <Button type="button" variant="outline" disabled={step === 1 || saving} onClick={onBack}>
                        Back
                    </Button>
                    <div className="flex gap-2">
                        <Link to={`${adminBasePath}/servers`} className="no-underline">
                            <Button type="button" variant="outline" disabled={saving}>
                                Cancel
                            </Button>
                        </Link>
                        {step < 5 ? (
                            <Button type="button" disabled={!validateStep(step)} onClick={onNext}>
                                Continue
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
