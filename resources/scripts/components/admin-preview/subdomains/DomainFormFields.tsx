import React from 'react';
import { Label } from '@/components/ui/label';
import { DnsProviderConfig, DnsProviders } from '@/api/admin/subdomains';
import { fieldClass } from '@/components/admin-preview/settings/fieldClass';

export interface DomainFormState {
    name: string;
    type: string;
    key: string;
    secret: string;
    consumer: string;
    cloudflare_id: string;
    ovh_api: string;
}

interface Props {
    form: DomainFormState;
    providers: DnsProviders;
    onChange: <K extends keyof DomainFormState>(key: K, value: DomainFormState[K]) => void;
    isEdit?: boolean;
}

const providerConfig = (providers: DnsProviders, type: string): DnsProviderConfig | undefined =>
    providers[type];

export default ({ form, providers, onChange, isEdit }: Props) => {
    const config = providerConfig(providers, form.type);

    return (
        <div className="space-y-5">
            <div className="space-y-2">
                <Label htmlFor="domain-name">Domain name</Label>
                <input
                    id="domain-name"
                    className={fieldClass}
                    value={form.name}
                    onChange={(e) => onChange('name', e.target.value)}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="domain-type">Provider</Label>
                <select
                    id="domain-type"
                    className={fieldClass}
                    value={form.type}
                    onChange={(e) => onChange('type', e.target.value)}
                >
                    {Object.entries(providers).map(([key, provider]) => (
                        <option key={key} value={key}>
                            {provider.title}
                        </option>
                    ))}
                </select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="domain-key">Key / API Token</Label>
                <input
                    id="domain-key"
                    className={fieldClass}
                    value={form.key}
                    onChange={(e) => onChange('key', e.target.value)}
                    required
                />
                <p className="text-xs text-muted-foreground">
                    {isEdit
                        ? 'Re-enter credentials when editing. Values are stored encrypted.'
                        : 'Credentials are stored encrypted.'}
                </p>
            </div>

            {config?.secret && (
                <div className="space-y-2">
                    <Label htmlFor="domain-secret">Secret</Label>
                    <input
                        id="domain-secret"
                        className={fieldClass}
                        value={form.secret}
                        onChange={(e) => onChange('secret', e.target.value)}
                    />
                </div>
            )}

            {config?.consumer && (
                <div className="space-y-2">
                    <Label htmlFor="domain-consumer">Consumer Key</Label>
                    <input
                        id="domain-consumer"
                        className={fieldClass}
                        value={form.consumer}
                        onChange={(e) => onChange('consumer', e.target.value)}
                    />
                </div>
            )}

            {config?.cloudflare_id && (
                <div className="space-y-2">
                    <Label htmlFor="domain-cloudflare-id">Cloudflare Zone ID</Label>
                    <input
                        id="domain-cloudflare-id"
                        className={fieldClass}
                        value={form.cloudflare_id}
                        onChange={(e) => onChange('cloudflare_id', e.target.value)}
                    />
                </div>
            )}

            {config?.ovh_api && (
                <div className="space-y-2">
                    <Label htmlFor="domain-ovh-api">OVH API Region</Label>
                    <select
                        id="domain-ovh-api"
                        className={fieldClass}
                        value={form.ovh_api}
                        onChange={(e) => onChange('ovh_api', e.target.value)}
                    >
                        <option value="eu">EU</option>
                        <option value="us">US</option>
                        <option value="ca">CA</option>
                    </select>
                </div>
            )}
        </div>
    );
};
