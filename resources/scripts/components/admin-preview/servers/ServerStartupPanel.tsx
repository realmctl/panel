import React, { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { useParams } from 'react-router-dom';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { getServerStartup, StartupEgg, updateServerStartup } from '@/api/admin/servers';
import { fieldClass, selectClass } from '@/components/admin-preview/settings/fieldClass';

export default () => {
    const { id } = useParams<{ id: string }>();
    const serverId = Number(id);
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data, error, isValidating, mutate } = useSWR(
        Number.isFinite(serverId) ? `admin-server-startup-${serverId}` : null,
        () => getServerStartup(serverId)
    );
    const [form, setForm] = useState({
        startup: '',
        nest_id: 0,
        egg_id: 0,
        docker_image: '',
        custom_docker_image: '',
        skip_scripts: false,
        environment: {} as Record<string, string>,
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!data) return;

        const { server, variables } = data;
        const egg = data.nests.flatMap((nest) => nest.eggs).find((item) => item.id === server.egg_id);
        const imageInEgg = egg ? Object.values(egg.docker_images).includes(server.image) : false;

        setForm({
            startup: server.startup,
            nest_id: server.nest_id,
            egg_id: server.egg_id,
            docker_image: imageInEgg ? server.image : '',
            custom_docker_image: imageInEgg ? '' : server.image,
            skip_scripts: server.skip_scripts,
            environment: { ...variables },
        });
    }, [data]);

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-servers', error });
        } else {
            clearFlashes('admin-servers');
        }
    }, [error, clearAndAddHttpError, clearFlashes]);

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

    const onNestChange = (nestId: number) => {
        const nest = data?.nests.find((item) => item.id === nestId);
        const nextEggId = nest?.eggs[0]?.id ?? 0;

        setForm((current) => ({
            ...current,
            nest_id: nestId,
            egg_id: nextEggId,
            docker_image: '',
            custom_docker_image: '',
        }));
    };

    const onEggChange = (eggId: number) => {
        setForm((current) => ({
            ...current,
            egg_id: eggId,
            docker_image: '',
            custom_docker_image: '',
        }));
    };

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        setSaving(true);
        clearFlashes('admin-servers');

        updateServerStartup(serverId, {
            startup: form.startup,
            nest_id: form.nest_id,
            egg_id: form.egg_id,
            docker_image: form.docker_image || undefined,
            custom_docker_image: form.custom_docker_image || undefined,
            skip_scripts: form.skip_scripts ? 1 : 0,
            environment: form.environment,
        })
            .then((response) => {
                addFlash({
                    key: 'admin-servers',
                    type: 'success',
                    title: 'Startup saved',
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
        return <p className="text-sm text-muted-foreground">Unable to load startup configuration.</p>;
    }

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <div className="rounded-lg border border-border bg-card">
                <div className="border-b border-border px-5 py-4">
                    <h2 className="text-base font-semibold text-foreground">Startup command</h2>
                </div>
                <div className="space-y-4 p-5">
                    <div className="space-y-2">
                        <Label htmlFor="startup">Startup command</Label>
                        <input
                            id="startup"
                            className={fieldClass}
                            value={form.startup}
                            onChange={(event) => {
                                const value = event.target.value;
                                setForm((current) => ({ ...current, startup: value }));
                            }}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="default-startup">Default service start command</Label>
                        <input id="default-startup" className={fieldClass} value={defaultStartup} readOnly />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-lg border border-border bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-foreground">Service configuration</h2>
                    </div>
                    <div className="space-y-4 p-5">
                        <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-muted-foreground">
                            Changing nest, egg, or docker image may trigger a reinstall.
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nest-id">Nest</Label>
                            <select
                                id="nest-id"
                                className={selectClass}
                                value={form.nest_id}
                                onChange={(event) => onNestChange(Number(event.target.value))}
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
                            >
                                {selectedNest?.eggs.map((egg) => (
                                    <option key={egg.id} value={egg.id}>
                                        {egg.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={form.skip_scripts}
                                onChange={(event) => {
                                    const checked = event.target.checked;
                                    setForm((current) => ({ ...current, skip_scripts: checked }));
                                }}
                            />
                            Skip egg install script
                        </label>
                    </div>
                </div>

                <div className="rounded-lg border border-border bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-foreground">Docker image</h2>
                    </div>
                    <div className="space-y-4 p-5">
                        <div className="space-y-2">
                            <Label htmlFor="docker-image">Image</Label>
                            <select
                                id="docker-image"
                                className={selectClass}
                                value={form.docker_image}
                                onChange={(event) => {
                                    const value = event.target.value;
                                    setForm((current) => ({
                                        ...current,
                                        docker_image: value,
                                        custom_docker_image: value ? '' : current.custom_docker_image,
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
                            <Label htmlFor="custom-docker-image">Custom image</Label>
                            <input
                                id="custom-docker-image"
                                className={fieldClass}
                                value={form.custom_docker_image}
                                placeholder="Or enter a custom image..."
                                onChange={(event) => {
                                    const value = event.target.value;
                                    setForm((current) => ({
                                        ...current,
                                        custom_docker_image: value,
                                        docker_image: value ? '' : current.docker_image,
                                    }));
                                }}
                            />
                        </div>
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
                                    value={form.environment[variable.env_variable] ?? variable.default_value ?? ''}
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
                                <p className="text-xs text-muted-foreground">
                                    Variable: <code>{variable.env_variable}</code> · Rules:{' '}
                                    <code>{variable.rules}</code>
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save startup'}
                </Button>
            </div>
        </form>
    );
};
