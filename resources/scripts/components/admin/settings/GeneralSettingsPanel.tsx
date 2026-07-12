import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link } from 'react-router-dom';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { getAdminSettings, GeneralSettings, updateGeneralSettings } from '@/api/admin/settings';
import { fieldClass, selectClass } from '@/components/admin/settings/fieldClass';
import { SettingRow, SettingsFooter, SettingsSection } from '@/components/admin/settings/settingsLayout';
import { adminBasePath } from '@/routers/adminRoutes';

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
        return <p className="text-sm text-muted-foreground">Unable to load settings.</p>;
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <SettingsSection
                title="Panel"
                description="Name and language shown across the interface."
            >
                <SettingRow
                    label="Company name"
                    htmlFor="company-name"
                    description="Used in the UI, page titles, and outgoing emails."
                >
                    <input
                        id="company-name"
                        className={fieldClass}
                        value={form['app:name']}
                        onChange={(e) => updateField('app:name', e.target.value)}
                        required
                    />
                </SettingRow>

                <SettingRow
                    label="Default language"
                    htmlFor="default-language"
                    description="Fallback language for users without a personal preference."
                >
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
                </SettingRow>
            </SettingsSection>

            <SettingsSection
                title="Access"
                description="Authentication and sign-up behaviour."
            >
                <SettingRow
                    label="Two-factor authentication"
                    htmlFor="two-factor"
                    description="Require 2FA before accounts in the selected group can use the panel."
                >
                    <select
                        id="two-factor"
                        className={selectClass}
                        value={String(form['realm:auth:2fa_required'])}
                        onChange={(e) =>
                            updateField('realm:auth:2fa_required', Number(e.target.value))
                        }
                    >
                        <option value="0">Not required</option>
                        <option value="1">Administrators only</option>
                        <option value="2">All users</option>
                    </select>
                </SettingRow>

                <SettingRow
                    label="User registration"
                    htmlFor="registration"
                    description={
                        data?.mailConfigured === false ? (
                            <>
                                Requires a working email provider, since new accounts must verify
                                their email address.{' '}
                                <Link to={`${adminBasePath}/settings/mail`} className="underline">
                                    Configure mail settings
                                </Link>
                                .
                            </>
                        ) : (
                            'Allow new accounts to be created from the login page. New accounts must verify their email address before they can log in.'
                        )
                    }
                >
                    <select
                        id="registration"
                        className={selectClass}
                        disabled={data?.mailConfigured === false}
                        value={data?.mailConfigured === false ? 'false' : form['realm:auth:registration_enabled']}
                        onChange={(e) =>
                            updateField(
                                'realm:auth:registration_enabled',
                                e.target.value as 'true' | 'false'
                            )
                        }
                    >
                        <option value="false">Disabled</option>
                        <option value="true">Enabled</option>
                    </select>
                </SettingRow>
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
