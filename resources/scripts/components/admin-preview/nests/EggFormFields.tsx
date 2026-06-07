import React from 'react';
import { Label } from '@/components/ui/label';
import { NestEggOption } from '@/api/admin/nests';
import { eggBackgroundOptions } from '@/components/admin-preview/nests/eggBackgrounds';
import { fieldClass } from '@/components/admin-preview/settings/fieldClass';

export interface EggFormState {
    nest_id: number | null;
    name: string;
    description: string;
    background: string;
    docker_images: string;
    force_outgoing_ip: boolean;
    startup: string;
    features: string;
    config_from: number | null;
    config_stop: string;
    config_logs: string;
    config_files: string;
    config_startup: string;
}

interface Props {
    form: EggFormState;
    nests?: { id: number; name: string; author: string }[];
    nestEggs?: NestEggOption[];
    currentEggId?: number;
    showNestSelect?: boolean;
    onChange: <K extends keyof EggFormState>(key: K, value: EggFormState[K]) => void;
}

export default ({ form, nests, nestEggs, currentEggId, showNestSelect, onChange }: Props) => {
    const configEggs = (nestEggs ?? []).filter((egg) => egg.id !== currentEggId);

    return (
        <div className="space-y-6">
            {showNestSelect && nests && (
                <div className="space-y-2">
                    <Label htmlFor="egg-nest">Associated nest</Label>
                    <select
                        id="egg-nest"
                        className={fieldClass}
                        value={form.nest_id ?? ''}
                        onChange={(e) => onChange('nest_id', Number(e.target.value))}
                        required
                    >
                        {nests.map((nest) => (
                            <option key={nest.id} value={nest.id}>
                                {nest.name} &lt;{nest.author}&gt;
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="egg-name">Name</Label>
                        <input
                            id="egg-name"
                            className={fieldClass}
                            value={form.name}
                            onChange={(e) => onChange('name', e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="egg-desc">Description</Label>
                        <textarea
                            id="egg-desc"
                            className={fieldClass}
                            rows={6}
                            value={form.description}
                            onChange={(e) => onChange('description', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="egg-bg">Card background</Label>
                        <select
                            id="egg-bg"
                            className={fieldClass}
                            value={form.background}
                            onChange={(e) => onChange('background', e.target.value)}
                        >
                            {eggBackgroundOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <label className="flex items-start gap-2 text-sm">
                        <input
                            type="checkbox"
                            className="mt-1"
                            checked={form.force_outgoing_ip}
                            onChange={(e) => onChange('force_outgoing_ip', e.target.checked)}
                        />
                        <span>
                            <span className="font-medium text-foreground">Force outgoing IP</span>
                            <span className="mt-1 block text-xs text-muted-foreground">
                                NATs outgoing traffic to the server&apos;s primary allocation IP.
                            </span>
                        </span>
                    </label>
                </div>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="egg-docker">Docker images</Label>
                        <textarea
                            id="egg-docker"
                            className={fieldClass}
                            rows={4}
                            value={form.docker_images}
                            onChange={(e) => onChange('docker_images', e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="egg-startup">Startup command</Label>
                        <textarea
                            id="egg-startup"
                            className={fieldClass}
                            rows={6}
                            value={form.startup}
                            onChange={(e) => onChange('startup', e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="egg-features">Features</Label>
                        <textarea
                            id="egg-features"
                            className={fieldClass}
                            rows={2}
                            placeholder="One feature per line"
                            value={form.features}
                            onChange={(e) => onChange('features', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-muted-foreground">
                Process management fields are required unless copying settings from another egg.
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="egg-config-from">Copy settings from</Label>
                        <select
                            id="egg-config-from"
                            className={fieldClass}
                            value={form.config_from ?? ''}
                            onChange={(e) =>
                                onChange('config_from', e.target.value ? Number(e.target.value) : null)
                            }
                        >
                            <option value="">None</option>
                            {configEggs.map((egg) => (
                                <option key={egg.id} value={egg.id}>
                                    {egg.name} &lt;{egg.author}&gt;
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="egg-stop">Stop command</Label>
                        <input
                            id="egg-stop"
                            className={fieldClass}
                            value={form.config_stop}
                            onChange={(e) => onChange('config_stop', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="egg-logs">Log configuration</Label>
                        <textarea
                            id="egg-logs"
                            className={fieldClass}
                            rows={5}
                            value={form.config_logs}
                            onChange={(e) => onChange('config_logs', e.target.value)}
                        />
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="egg-files">Configuration files</Label>
                        <textarea
                            id="egg-files"
                            className={fieldClass}
                            rows={5}
                            value={form.config_files}
                            onChange={(e) => onChange('config_files', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="egg-config-startup">Start configuration</Label>
                        <textarea
                            id="egg-config-startup"
                            className={fieldClass}
                            rows={5}
                            value={form.config_startup}
                            onChange={(e) => onChange('config_startup', e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export const parseFeatures = (value: string): string[] =>
    value
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

export const eggToFormState = (egg: {
    nest_id: number;
    name: string;
    description: string | null;
    background: string | null;
    docker_images: string;
    force_outgoing_ip: boolean;
    startup: string;
    features: string[];
    config_from: number | null;
    config_stop: string | null;
    config_logs: string;
    config_files: string;
    config_startup: string;
}): EggFormState => ({
    nest_id: egg.nest_id,
    name: egg.name,
    description: egg.description ?? '',
    background: egg.background ?? '',
    docker_images: egg.docker_images,
    force_outgoing_ip: egg.force_outgoing_ip,
    startup: egg.startup,
    features: (egg.features ?? []).join('\n'),
    config_from: egg.config_from,
    config_stop: egg.config_stop ?? '',
    config_logs: egg.config_logs,
    config_files: egg.config_files,
    config_startup: egg.config_startup,
});

export const formToEggPayload = (form: EggFormState) => ({
    nest_id: form.nest_id ?? undefined,
    name: form.name,
    description: form.description || undefined,
    background: form.background || undefined,
    docker_images: form.docker_images,
    force_outgoing_ip: form.force_outgoing_ip ? 1 : 0,
    startup: form.startup,
    features: parseFeatures(form.features),
    config_from: form.config_from || null,
    config_stop: form.config_stop || undefined,
    config_logs: form.config_logs || undefined,
    config_files: form.config_files || undefined,
    config_startup: form.config_startup || undefined,
});
