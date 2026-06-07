import React from 'react';
import { Label } from '@/components/ui/label';
import { SubdomainOption } from '@/api/admin/subdomains';
import { fieldClass } from '@/components/admin-preview/settings/fieldClass';
import { cn } from '@/lib/utils';

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
        <div className="space-y-5">
            <div className="space-y-2">
                <Label htmlFor="record-name">Name</Label>
                <input
                    id="record-name"
                    className={fieldClass}
                    value={form.name}
                    onChange={(e) => onChange('name', e.target.value)}
                    required
                />
                <p className="text-xs text-muted-foreground">Visible to customers when creating a subdomain.</p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="record-domain">Domain</Label>
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
            </div>

            <div className="space-y-2">
                <Label>Eggs</Label>
                <p className="text-xs text-muted-foreground">
                    Servers only see templates linked to their egg. Select every egg that should be allowed to create
                    this subdomain type.
                </p>
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
            </div>

            <div className="space-y-2">
                <Label htmlFor="record-type">Type</Label>
                <select
                    id="record-type"
                    className={fieldClass}
                    value={form.type}
                    onChange={(e) => onChange('type', e.target.value)}
                >
                    <option value="SRV">SRV</option>
                    <option value="CNAME">CNAME</option>
                </select>
            </div>

            {isSrv && (
                <div className={cn('space-y-5 rounded-md border border-border p-4')}>
                    <div className="space-y-2">
                        <Label htmlFor="record-ttl">TTL</Label>
                        <input
                            id="record-ttl"
                            className={fieldClass}
                            value={form.ttl}
                            onChange={(e) => onChange('ttl', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="record-protocol">Protocol</Label>
                        <select
                            id="record-protocol"
                            className={fieldClass}
                            value={form.protocol}
                            onChange={(e) => onChange('protocol', e.target.value)}
                        >
                            <option value="tcp">TCP</option>
                            <option value="udp">UDP</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="record-priority">Priority</Label>
                        <input
                            id="record-priority"
                            className={fieldClass}
                            value={form.priority}
                            onChange={(e) => onChange('priority', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="record-weight">Weight</Label>
                        <input
                            id="record-weight"
                            className={fieldClass}
                            value={form.weight}
                            onChange={(e) => onChange('weight', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="record-service">Service</Label>
                        <input
                            id="record-service"
                            className={fieldClass}
                            value={form.service}
                            onChange={(e) => onChange('service', e.target.value)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
