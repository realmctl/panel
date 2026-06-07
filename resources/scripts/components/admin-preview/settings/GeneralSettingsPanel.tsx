import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { getAdminSettings, GeneralSettings, updateGeneralSettings } from '@/api/admin/settings';
import { fieldClass, selectClass } from '@/components/admin-preview/settings/fieldClass';

export default () => {
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data, error, isValidating, mutate } = useSWR('admin-settings', getAdminSettings);
    const [form, setForm] = useState<GeneralSettings | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (data?.general) {
            setForm(data.general);
        }
    }, [data]);

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-settings', error });
        } else {
            clearFlashes('admin-settings');
        }
    }, [error]);

    const updateField = <K extends keyof GeneralSettings>(key: K, value: GeneralSettings[K]) => {
        setForm((current) => (current ? { ...current, [key]: value } : current));
    };

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!form) return;

        setSaving(true);
        clearFlashes('admin-settings');

        updateGeneralSettings(form)
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
        return <p className="text-sm text-muted-foreground">Unable to load settings.</p>;
    }

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <div className="rounded-lg border border-border bg-card">
                <div className="border-b border-border px-5 py-4">
                    <h2 className="text-base font-semibold text-foreground">Panel settings</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Basic panel configuration used across the UI and outgoing emails.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="company-name">Company name</Label>
                        <input
                            id="company-name"
                            className={fieldClass}
                            value={form['app:name']}
                            onChange={(e) => updateField('app:name', e.target.value)}
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            Used throughout the panel and in emails sent to clients.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="default-language">Default language</Label>
                        <select
                            id="default-language"
                            className={selectClass}
                            value={form['app:locale']}
                            onChange={(e) => updateField('app:locale', e.target.value)}
                        >
                            {Object.entries(data?.languages || {}).map(([key, label]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-muted-foreground">Default language for UI components.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="two-factor">Require 2-factor authentication</Label>
                        <select
                            id="two-factor"
                            className={selectClass}
                            value={String(form['pterodactyl:auth:2fa_required'])}
                            onChange={(e) =>
                                updateField('pterodactyl:auth:2fa_required', Number(e.target.value))
                            }
                        >
                            <option value="0">Not required</option>
                            <option value="1">Admin only</option>
                            <option value="2">All users</option>
                        </select>
                        <p className="text-xs text-muted-foreground">
                            Accounts in the selected group must enable 2FA before using the panel.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="registration">User registration</Label>
                        <select
                            id="registration"
                            className={selectClass}
                            value={form['pterodactyl:auth:registration_enabled']}
                            onChange={(e) =>
                                updateField(
                                    'pterodactyl:auth:registration_enabled',
                                    e.target.value as 'true' | 'false'
                                )
                            }
                        >
                            <option value="false">Disabled</option>
                            <option value="true">Enabled</option>
                        </select>
                        <p className="text-xs text-muted-foreground">
                            Allow new users to register from the login page.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end border-t border-border px-5 py-4">
                    <Button type="submit" disabled={saving}>
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? 'Saving...' : 'Save changes'}
                    </Button>
                </div>
            </div>
        </form>
    );
};
