import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { getOAuthSettings, OAuthSettings, updateOAuthSettings } from '@/api/admin/settings';
import { fieldClass, selectClass } from '@/components/admin-preview/settings/fieldClass';
import { SettingRow, SettingsFooter, SettingsSection } from '@/components/admin-preview/settings/settingsLayout';

type OAuthProvider = 'google' | 'discord' | 'github';

const PROVIDERS: {
    id: OAuthProvider;
    label: string;
    description: React.ReactNode;
}[] = [
    {
        id: 'google',
        label: 'Google',
        description: (
            <>
                Sign in with Google. Credentials from the{' '}
                <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                >
                    Google Cloud Console
                </a>
                .
            </>
        ),
    },
    {
        id: 'discord',
        label: 'Discord',
        description: (
            <>
                Sign in with Discord. Credentials from the{' '}
                <a
                    href="https://discord.com/developers/applications"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                >
                    Discord Developer Portal
                </a>
                .
            </>
        ),
    },
    {
        id: 'github',
        label: 'GitHub',
        description: (
            <>
                Sign in with GitHub. Credentials from{' '}
                <a
                    href="https://github.com/settings/developers"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                >
                    GitHub Developer Settings
                </a>
                .
            </>
        ),
    },
];

export default () => {
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data, error, isValidating, mutate } = useSWR('admin-settings-oauth', getOAuthSettings);
    const [form, setForm] = useState<OAuthSettings | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (data?.settings) {
            setForm(data.settings);
        }
    }, [data]);

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-settings', error });
        } else {
            clearFlashes('admin-settings');
        }
    }, [error]);

    const updateField = <K extends keyof OAuthSettings>(key: K, value: OAuthSettings[K]) => {
        setForm((current) => (current ? { ...current, [key]: value } : current));
    };

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!form) return;

        setSaving(true);
        clearFlashes('admin-settings');

        updateOAuthSettings(form)
            .then((response: any) => {
                addFlash({
                    key: 'admin-settings',
                    type: 'success',
                    title: 'Settings saved',
                    message: response.message,
                });
                mutate();
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-settings', error: submitError });
            })
            .finally(() => setSaving(false));
    };

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    if (!form) {
        return <p className="text-sm text-muted-foreground">Unable to load OAuth settings.</p>;
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            {PROVIDERS.map((provider) => (
                <SettingsSection key={provider.id} title={provider.label} description={provider.description}>
                    <SettingRow label="Status" htmlFor={`${provider.id}-enabled`} description="Show this provider on the login page.">
                        <select
                            id={`${provider.id}-enabled`}
                            className={selectClass}
                            value={form[`oauth:${provider.id}:enabled`]}
                            onChange={(e) =>
                                updateField(`oauth:${provider.id}:enabled`, e.target.value as 'true' | 'false')
                            }
                        >
                            <option value="false">Disabled</option>
                            <option value="true">Enabled</option>
                        </select>
                    </SettingRow>
                    <SettingRow
                        label="Client ID"
                        htmlFor={`${provider.id}-client-id`}
                        description="OAuth application client identifier."
                    >
                        <input
                            id={`${provider.id}-client-id`}
                            className={fieldClass}
                            value={form[`oauth:${provider.id}:client_id`]}
                            onChange={(e) => updateField(`oauth:${provider.id}:client_id`, e.target.value)}
                        />
                    </SettingRow>
                    <SettingRow
                        label="Client secret"
                        htmlFor={`${provider.id}-client-secret`}
                        description="Keep this private. Required when the provider is enabled."
                    >
                        <input
                            id={`${provider.id}-client-secret`}
                            type="password"
                            className={fieldClass}
                            value={form[`oauth:${provider.id}:client_secret`]}
                            onChange={(e) => updateField(`oauth:${provider.id}:client_secret`, e.target.value)}
                        />
                    </SettingRow>
                </SettingsSection>
            ))}

            <SettingsSection
                title="Callback URLs"
                description="Add these redirect URLs in each provider's OAuth app settings."
            >
                {PROVIDERS.map((provider) => (
                    <div
                        key={provider.id}
                        className="flex flex-col gap-2 px-5 py-4 md:flex-row md:items-center md:justify-between md:gap-8"
                    >
                        <span className="shrink-0 text-sm text-muted-foreground">{provider.label}</span>
                        <code className="min-w-0 truncate rounded bg-muted px-2 py-1 text-xs text-foreground md:max-w-md md:text-right">
                            {data?.callbackUrls[provider.id]}
                        </code>
                    </div>
                ))}
            </SettingsSection>

            <SettingsFooter>
                <Button type="submit" disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save changes'}
                </Button>
            </SettingsFooter>
        </form>
    );
};
