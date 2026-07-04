import React from 'react';
import { SubdomainOption } from '@/api/admin/subdomains';
import { fieldClass } from '@/components/admin/settings/fieldClass';
import { SegmentedControl, SettingRow } from '@/components/admin/settings/settingsLayout';

export interface RecordFormState {
    name: string;
    domain_id: number | null;
    egg_ids: number[];
    type: string;
    ttl: string;
    protocol: string;
    priority: string;
    weight: string;
    service: string;
}

interface Props {
    form: RecordFormState;
    domains: SubdomainOption[];
    eggs: SubdomainOption[];
    onChange: <K extends keyof RecordFormState>(key: K, value: RecordFormState[K]) => void;
    onToggleEgg: (eggId: number) => void;
    onApplyPreset: (values: Partial<RecordFormState>) => void;
}

interface RecordPreset {
    key: string;
    label: string;
    description: string;
    values: Partial<RecordFormState>;
}

export const RECORD_PRESETS: RecordPreset[] = [
    {
        key: 'minecraft-java',
        label: 'Minecraft (Java)',
        description: 'SRV record — lets players connect without a port in the address.',
        values: { type: 'SRV', ttl: '3600', protocol: 'tcp', priority: '0', weight: '5', service: '_minecraft' },
    },
    {
        key: 'minecraft-bedrock',
        label: 'Minecraft (Bedrock)',
        description: "CNAME record — Bedrock clients don't support SRV, server must run on the default port.",
        values: { type: 'CNAME', ttl: '3600' },
    },
    {
        key: 'teamspeak',
        label: 'TeamSpeak 3',
        description: 'SRV record for TS3 voice servers.',
        values: { type: 'SRV', ttl: '3600', protocol: 'udp', priority: '0', weight: '5', service: '_ts3' },
    },
    {
        key: 'mumble',
        label: 'Mumble',
        description: 'SRV record for Mumble voice servers.',
        values: { type: 'SRV', ttl: '3600', protocol: 'tcp', priority: '0', weight: '5', service: '_mumble' },
    },
    {
        key: 'generic',
        label: 'Generic (CNAME)',
        description: 'Plain CNAME pointing at the node — no SRV fields.',
        values: { type: 'CNAME', ttl: '3600' },
    },
];

export default ({ form, domains, eggs, onChange, onToggleEgg, onApplyPreset }: Props) => {
    const isSrv = form.type === 'SRV';

    return (
        <>
            <SettingRow
                label="Quick template"
                description="Fill in common protocol defaults, then adjust anything below before saving."
            >
                <div className="flex flex-wrap gap-2">
                    {RECORD_PRESETS.map((preset) => (
                        <button
                            key={preset.key}
                            type="button"
                            title={preset.description}
                            onClick={() => onApplyPreset(preset.values)}
                            className="rounded-md border border-border bg-muted/30 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
            </SettingRow>

            <SettingRow
                label="Name"
                htmlFor="record-name"
                description="Visible to customers when creating a subdomain."
            >
                <input
                    id="record-name"
                    className={fieldClass}
                    value={form.name}
                    onChange={(e) => onChange('name', e.target.value)}
                    required
                />
            </SettingRow>

            <SettingRow
                label="Domain"
                htmlFor="record-domain"
                description="Which configured domain this template belongs to."
            >
                <select
                    id="record-domain"
                    className={fieldClass}
                    value={form.domain_id ?? ''}
                    onChange={(e) => onChange('domain_id', Number(e.target.value))}
                    required
                >
                    {domains.map((domain) => (
                        <option key={domain.id} value={domain.id}>
                            {domain.name}
                        </option>
                    ))}
                </select>
            </SettingRow>

            <SettingRow
                label="Eggs"
                description="Servers only see templates linked to their egg. Select every egg that should allow this subdomain type."
            >
                <div className="max-h-48 overflow-y-auto rounded-md border border-border p-3">
                    {eggs.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No eggs available.</p>
                    ) : (
                        <div className="space-y-2">
                            {eggs.map((egg) => (
                                <label
                                    key={egg.id}
                                    className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                                >
                                    <input
                                        type="checkbox"
                                        className="rounded border-border"
                                        checked={form.egg_ids.includes(egg.id)}
                                        onChange={() => onToggleEgg(egg.id)}
                                    />
                                    {egg.name}
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            </SettingRow>

            <SettingRow label="Record type" description="DNS record type created for the subdomain.">
                <SegmentedControl
                    value={form.type}
                    options={[
                        { value: 'SRV', label: 'SRV' },
                        { value: 'CNAME', label: 'CNAME' },
                    ]}
                    onChange={(value) => onChange('type', value)}
                />
            </SettingRow>

            {isSrv && (
                <>
                    <SettingRow label="TTL" htmlFor="record-ttl" description="Time-to-live in seconds.">
                        <input
                            id="record-ttl"
                            className={fieldClass}
                            value={form.ttl}
                            onChange={(e) => onChange('ttl', e.target.value)}
                        />
                    </SettingRow>

                    <SettingRow label="Protocol" description="Transport protocol for the SRV record.">
                        <SegmentedControl
                            value={form.protocol}
                            options={[
                                { value: 'tcp', label: 'TCP' },
                                { value: 'udp', label: 'UDP' },
                            ]}
                            onChange={(value) => onChange('protocol', value)}
                        />
                    </SettingRow>

                    <SettingRow label="Priority" htmlFor="record-priority" description="SRV priority value.">
                        <input
                            id="record-priority"
                            className={fieldClass}
                            value={form.priority}
                            onChange={(e) => onChange('priority', e.target.value)}
                        />
                    </SettingRow>

                    <SettingRow label="Weight" htmlFor="record-weight" description="SRV weight value.">
                        <input
                            id="record-weight"
                            className={fieldClass}
                            value={form.weight}
                            onChange={(e) => onChange('weight', e.target.value)}
                        />
                    </SettingRow>

                    <SettingRow
                        label="Service"
                        htmlFor="record-service"
                        description="Service name prefix, e.g. _minecraft."
                    >
                        <input
                            id="record-service"
                            className={fieldClass}
                            value={form.service}
                            onChange={(e) => onChange('service', e.target.value)}
                        />
                    </SettingRow>
                </>
            )}
        </>
    );
};
