import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { getOAuthSettings, OAuthSettings, updateOAuthSettings } from '@/api/admin/settings';
import { fieldClass, selectClass } from '@/components/admin-preview/settings/fieldClass';

type OAuthProvider = 'google' | 'discord' | 'github';

const PROVIDERS: { id: OAuthProvider; label: string; hint: React.ReactNode }[] = [
    {
        id: 'google',
        label: 'Google sign in',
        hint: (
            <>
                Get credentials from the{' '}
                <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary"
                >
                    Google Cloud Console
                </a>
                .
            </>
        ),
    },
    {
        id: 'discord',
        label: 'Discord sign in',
        hint: (
            <>
                Get credentials from the{' '}
                <a
                    href="https://discord.com/developers/applications"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary"
                >
                    Discord Developer Portal
                </a>
                .
            </>
        ),
    },
    {
        id: 'github',
        label: 'GitHub sign in',
        hint: (
            <>
                Get credentials from{' '}
                <a
                    href="https://github.com/settings/developers"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary"
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
            .then((response) => {
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
        <form onSubmit={onSubmit} className="space-y-6">
            {PROVIDERS.map((provider) => (
                <div key={provider.id} className="rounded-lg border border-border bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-foreground">{provider.label}</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor={`${provider.id}-enabled`}>Status</Label>
                            <select
                                id={`${provider.id}-enabled`}
                                className={selectClass}
                                value={form[`oauth:${provider.id}:enabled`]}
                                onChange={(e) =>
                                    updateField(
                                        `oauth:${provider.id}:enabled`,
                                        e.target.value as 'true' | 'false'
                                    )
                                }
                            >
                                <option value="false">Disabled</option>
                                <option value="true">Enabled</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`${provider.id}-client-id`}>Client ID</Label>
                            <input
                                id={`${provider.id}-client-id`}
                                className={fieldClass}
                                value={form[`oauth:${provider.id}:client_id`]}
                                onChange={(e) =>
                                    updateField(`oauth:${provider.id}:client_id`, e.target.value)
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`${provider.id}-client-secret`}>Client secret</Label>
                            <input
                                id={`${provider.id}-client-secret`}
                                className={fieldClass}
                                value={form[`oauth:${provider.id}:client_secret`]}
                                onChange={(e) =>
                                    updateField(`oauth:${provider.id}:client_secret`, e.target.value)
                                }
                            />
                            <p className="text-xs text-muted-foreground">{provider.hint}</p>
                        </div>
                    </div>
                </div>
            ))}

            <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-base font-semibold text-foreground">Callback URLs</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Use these URLs when configuring your OAuth applications:
                </p>
                <div className="mt-4 space-y-2 text-sm">
                    {PROVIDERS.map((provider) => (
                        <div key={provider.id}>
                            <code className="rounded bg-muted px-2 py-1 text-xs">
                                {data?.callbackUrls[provider.id]}
                            </code>
                            <span className="ml-2 text-muted-foreground">— {provider.label.replace(' sign in', '')}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save changes'}
                </Button>
            </div>
        </form>
    );
};
