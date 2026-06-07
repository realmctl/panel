import React, { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { Link, useParams } from 'react-router-dom';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { getServer, getServerStartup, StartupEgg, updateServerStartup } from '@/api/admin/servers';
import { fieldClass, selectClass } from '@/components/admin-preview/settings/fieldClass';
import {
    SegmentedControl,
    SettingRow,
    SettingsFooter,
    SettingsSection,
} from '@/components/admin-preview/settings/settingsLayout';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';

export default () => {
    const { id } = useParams<{ id: string }>();
    const serverId = Number(id);
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data: serverData } = useSWR(
        Number.isFinite(serverId) ? `admin-server-${serverId}` : null,
        () => getServer(serverId)
    );
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

    const serverName = serverData?.server.name ?? 'Server';

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="overflow-hidden rounded-md border border-border bg-card px-5 py-4">
                <h2 className="text-base font-semibold text-foreground">{serverName}</h2>
                <p className="mt-1 text-sm text-muted-foreground">Startup configuration</p>
            </div>

            <p className="rounded-md border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-muted-foreground">
                Changing nest, egg, or docker image may trigger a reinstall.
            </p>

            <SettingsSection title="Startup command" description="Command run when the server starts.">
                <SettingRow label="Command" htmlFor="startup" description="Override the egg default startup command." wide>
                    <input
                        id="startup"
                        className={fieldClass}
                        value={form.startup}
                        onChange={(e) => setForm((current) => ({ ...current, startup: e.target.value }))}
                    />
                </SettingRow>
                <SettingRow label="Egg default" description="Default command from the selected egg.">
                    <code className="block break-all rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-foreground">
                        {defaultStartup}
                    </code>
                </SettingRow>
            </SettingsSection>

            <SettingsSection title="Service" description="Nest, egg, and install script behavior.">
                <SettingRow label="Nest" htmlFor="nest-id" description="Service category for this server.">
                    <select
                        id="nest-id"
                        className={selectClass}
                        value={form.nest_id}
                        onChange={(e) => onNestChange(Number(e.target.value))}
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
                        onChange={(e) => onEggChange(Number(e.target.value))}
                    >
                        {selectedNest?.eggs.map((egg) => (
                            <option key={egg.id} value={egg.id}>
                                {egg.name}
                            </option>
                        ))}
                    </select>
                </SettingRow>
                <SettingRow label="Install script" description="Run the egg install script on reinstall.">
                    <SegmentedControl
                        value={form.skip_scripts}
                        options={[
                            { value: false, label: 'Run' },
                            { value: true, label: 'Skip' },
                        ]}
                        onChange={(value) => setForm((current) => ({ ...current, skip_scripts: value }))}
                    />
                </SettingRow>
            </SettingsSection>

            <SettingsSection title="Docker image" description="Container image used to run this server.">
                <SettingRow label="Image" htmlFor="docker-image" description="Select from egg-defined images.">
                    <select
                        id="docker-image"
                        className={selectClass}
                        value={form.docker_image}
                        onChange={(e) => {
                            const value = e.target.value;
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
                </SettingRow>
                <SettingRow
                    label="Custom image"
                    htmlFor="custom-docker-image"
                    description="Use a custom image instead of the egg default."
                >
                    <input
                        id="custom-docker-image"
                        className={fieldClass}
                        value={form.custom_docker_image}
                        placeholder="e.g. ghcr.io/org/image:tag"
                        onChange={(e) => {
                            const value = e.target.value;
                            setForm((current) => ({
                                ...current,
                                custom_docker_image: value,
                                docker_image: value ? '' : current.docker_image,
                            }));
                        }}
                    />
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
                                value={form.environment[variable.env_variable] ?? variable.default_value ?? ''}
                                onChange={(e) => {
                                    const value = e.target.value;
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
