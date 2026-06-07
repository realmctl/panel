import React from 'react';
import { NestEggOption } from '@/api/admin/nests';
import { eggBackgroundOptions } from '@/components/admin-preview/nests/eggBackgrounds';
import { fieldClass, textareaClass } from '@/components/admin-preview/settings/fieldClass';
import {
    SegmentedControl,
    SettingRow,
    SettingsSection,
} from '@/components/admin-preview/settings/settingsLayout';

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
        <>
            <SettingsSection title="General" description="Identity and display options for this egg.">
                {showNestSelect && nests && (
                    <SettingRow label="Nest" htmlFor="egg-nest" description="Category this egg belongs to.">
                        <select
                            id="egg-nest"
                            className={fieldClass}
                            value={form.nest_id ?? ''}
                            onChange={(e) => onChange('nest_id', Number(e.target.value))}
                            required
                        >
                            {nests.map((nest) => (
                                <option key={nest.id} value={nest.id}>
                                    {nest.name} ({nest.author})
                                </option>
                            ))}
                        </select>
                    </SettingRow>
                )}
                <SettingRow label="Name" htmlFor="egg-name" description="Display name shown to customers.">
                    <input
                        id="egg-name"
                        className={fieldClass}
                        value={form.name}
                        onChange={(e) => onChange('name', e.target.value)}
                        required
                    />
                </SettingRow>
                <SettingRow
                    label="Description"
                    htmlFor="egg-desc"
                    description="Short summary of what this egg deploys."
                    wide
                >
                    <textarea
                        id="egg-desc"
                        className={textareaClass}
                        rows={4}
                        value={form.description}
                        onChange={(e) => onChange('description', e.target.value)}
                    />
                </SettingRow>
                <SettingRow label="Card background" htmlFor="egg-bg" description="Background style on the server card.">
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
                </SettingRow>
                <SettingRow
                    label="Force outgoing IP"
                    description="NAT outgoing traffic to the server's primary allocation IP."
                >
                    <SegmentedControl
                        value={form.force_outgoing_ip}
                        options={[
                            { value: false, label: 'No' },
                            { value: true, label: 'Yes' },
                        ]}
                        onChange={(value) => onChange('force_outgoing_ip', value)}
                    />
                </SettingRow>
            </SettingsSection>

            <SettingsSection title="Docker & startup" description="Container image and boot command.">
                <SettingRow
                    label="Docker images"
                    htmlFor="egg-docker"
                    description="One image per line. First image is the default."
                    wide
                >
                    <textarea
                        id="egg-docker"
                        className={textareaClass}
                        rows={4}
                        value={form.docker_images}
                        onChange={(e) => onChange('docker_images', e.target.value)}
                        required
                    />
                </SettingRow>
                <SettingRow
                    label="Startup command"
                    htmlFor="egg-startup"
                    description="Command run when the server starts."
                    wide
                >
                    <textarea
                        id="egg-startup"
                        className={textareaClass}
                        rows={4}
                        value={form.startup}
                        onChange={(e) => onChange('startup', e.target.value)}
                        required
                    />
                </SettingRow>
                <SettingRow
                    label="Features"
                    htmlFor="egg-features"
                    description="One feature flag per line."
                    wide
                >
                    <textarea
                        id="egg-features"
                        className={textareaClass}
                        rows={2}
                        placeholder="One feature per line"
                        value={form.features}
                        onChange={(e) => onChange('features', e.target.value)}
                    />
                </SettingRow>
            </SettingsSection>

            <SettingsSection
                title="Process management"
                description="Required unless copying settings from another egg in this nest."
            >
                <SettingRow
                    label="Copy settings from"
                    htmlFor="egg-config-from"
                    description="Reuse process config from another egg."
                >
                    <select
                        id="egg-config-from"
                        className={fieldClass}
                        value={form.config_from ?? ''}
                        onChange={(e) => onChange('config_from', e.target.value ? Number(e.target.value) : null)}
                    >
                        <option value="">None</option>
                        {configEggs.map((egg) => (
                            <option key={egg.id} value={egg.id}>
                                {egg.name} ({egg.author})
                            </option>
                        ))}
                    </select>
                </SettingRow>
                <SettingRow label="Stop command" htmlFor="egg-stop" description="Command sent to stop the server.">
                    <input
                        id="egg-stop"
                        className={fieldClass}
                        value={form.config_stop}
                        onChange={(e) => onChange('config_stop', e.target.value)}
                    />
                </SettingRow>
                <SettingRow label="Log configuration" htmlFor="egg-logs" description="JSON log parser config." wide>
                    <textarea
                        id="egg-logs"
                        className={textareaClass}
                        rows={4}
                        value={form.config_logs}
                        onChange={(e) => onChange('config_logs', e.target.value)}
                    />
                </SettingRow>
                <SettingRow
                    label="Configuration files"
                    htmlFor="egg-files"
                    description="JSON file parser definitions."
                    wide
                >
                    <textarea
                        id="egg-files"
                        className={textareaClass}
                        rows={4}
                        value={form.config_files}
                        onChange={(e) => onChange('config_files', e.target.value)}
                    />
                </SettingRow>
                <SettingRow
                    label="Start configuration"
                    htmlFor="egg-config-startup"
                    description="JSON startup detection config."
                    wide
                >
                    <textarea
                        id="egg-config-startup"
                        className={textareaClass}
                        rows={4}
                        value={form.config_startup}
                        onChange={(e) => onChange('config_startup', e.target.value)}
                    />
                </SettingRow>
            </SettingsSection>
        </>
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
