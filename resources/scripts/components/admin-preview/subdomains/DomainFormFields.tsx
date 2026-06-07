import React from 'react';
import { DnsProviderConfig, DnsProviders } from '@/api/admin/subdomains';
import { fieldClass } from '@/components/admin-preview/settings/fieldClass';
import { SettingRow } from '@/components/admin-preview/settings/settingsLayout';

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
        <>
            <SettingRow
                label="Domain name"
                htmlFor="domain-name"
                description="The root domain customers can create subdomains under."
            >
                <input
                    id="domain-name"
                    className={fieldClass}
                    value={form.name}
                    onChange={(e) => onChange('name', e.target.value)}
                    required
                />
            </SettingRow>

            <SettingRow
                label="Provider"
                htmlFor="domain-type"
                description="DNS provider used to manage records for this domain."
            >
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
            </SettingRow>

            <SettingRow
                label="Key / API token"
                htmlFor="domain-key"
                description={
                    isEdit
                        ? 'Re-enter credentials when editing. Values are stored encrypted.'
                        : 'Credentials are stored encrypted.'
                }
            >
                <input
                    id="domain-key"
                    className={fieldClass}
                    value={form.key}
                    onChange={(e) => onChange('key', e.target.value)}
                    required
                />
            </SettingRow>

            {config?.secret && (
                <SettingRow label="Secret" htmlFor="domain-secret" description="Provider secret key.">
                    <input
                        id="domain-secret"
                        className={fieldClass}
                        value={form.secret}
                        onChange={(e) => onChange('secret', e.target.value)}
                    />
                </SettingRow>
            )}

            {config?.consumer && (
                <SettingRow
                    label="Consumer key"
                    htmlFor="domain-consumer"
                    description="OAuth consumer key for this provider."
                >
                    <input
                        id="domain-consumer"
                        className={fieldClass}
                        value={form.consumer}
                        onChange={(e) => onChange('consumer', e.target.value)}
                    />
                </SettingRow>
            )}

            {config?.cloudflare_id && (
                <SettingRow
                    label="Cloudflare zone ID"
                    htmlFor="domain-cloudflare-id"
                    description="Zone ID from the Cloudflare dashboard."
                >
                    <input
                        id="domain-cloudflare-id"
                        className={fieldClass}
                        value={form.cloudflare_id}
                        onChange={(e) => onChange('cloudflare_id', e.target.value)}
                    />
                </SettingRow>
            )}

            {config?.ovh_api && (
                <SettingRow
                    label="OVH API region"
                    htmlFor="domain-ovh-api"
                    description="API endpoint region for your OVH account."
                >
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
                </SettingRow>
            )}
        </>
    );
};
