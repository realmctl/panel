import React from 'react';
import { SubdomainOption } from '@/api/admin/subdomains';
import { fieldClass } from '@/components/admin-preview/settings/fieldClass';
import { SegmentedControl, SettingRow } from '@/components/admin-preview/settings/settingsLayout';

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
}

export default ({ form, domains, eggs, onChange, onToggleEgg }: Props) => {
    const isSrv = form.type === 'SRV';

    return (
        <>
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
