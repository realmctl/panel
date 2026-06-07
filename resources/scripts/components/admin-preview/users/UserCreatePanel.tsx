import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useHistory } from 'react-router-dom';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { createUser, getUserCreateMeta } from '@/api/admin/users';
import { fieldClass } from '@/components/admin-preview/settings/fieldClass';
import {
    SegmentedControl,
    SettingRow,
    SettingsFooter,
    SettingsSection,
} from '@/components/admin-preview/settings/settingsLayout';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';

export default () => {
    const history = useHistory();
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data, error, isValidating } = useSWR('admin-users-create', getUserCreateMeta);
    const [form, setForm] = useState({
        email: '',
        username: '',
        name_first: '',
        name_last: '',
        language: '',
        root_admin: false,
        password: '',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-users', error });
        } else {
            clearFlashes('admin-users');
        }
    }, [error]);

    useEffect(() => {
        if (data?.default_language && !form.language) {
            setForm((current) => ({ ...current, language: data.default_language }));
        }
    }, [data, form.language]);

    const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        setSaving(true);
        clearFlashes('admin-users');

        createUser({
            ...form,
            root_admin: form.root_admin ? 1 : 0,
            password: form.password || undefined,
        })
            .then((response) => {
                addFlash({
                    key: 'admin-users',
                    type: 'success',
                    title: 'User created',
                    message: response.message,
                });
                history.push(`${adminPreviewBasePath}/users/${response.user!.id}`);
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-users', error: submitError });
            })
            .finally(() => setSaving(false));
    };

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    if (!data) {
        return <p className="text-sm text-muted-foreground">Unable to load user form.</p>;
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <SettingsSection title="New user" description="Create a panel account for a customer or team member.">
                <SettingRow label="Email" htmlFor="user-email" description="Login address and account identifier.">
                    <input
                        id="user-email"
                        type="email"
                        autoComplete="off"
                        className={fieldClass}
                        value={form.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        required
                    />
                </SettingRow>
                <SettingRow label="Username" htmlFor="user-username" description="Unique handle shown across the panel.">
                    <input
                        id="user-username"
                        autoComplete="off"
                        className={fieldClass}
                        value={form.username}
                        onChange={(e) => updateField('username', e.target.value)}
                        required
                    />
                </SettingRow>
                <SettingRow label="First name" htmlFor="user-first" description="Given name for the account.">
                    <input
                        id="user-first"
                        autoComplete="off"
                        className={fieldClass}
                        value={form.name_first}
                        onChange={(e) => updateField('name_first', e.target.value)}
                        required
                    />
                </SettingRow>
                <SettingRow label="Last name" htmlFor="user-last" description="Family name for the account.">
                    <input
                        id="user-last"
                        autoComplete="off"
                        className={fieldClass}
                        value={form.name_last}
                        onChange={(e) => updateField('name_last', e.target.value)}
                        required
                    />
                </SettingRow>
                <SettingRow
                    label="Default language"
                    htmlFor="user-language"
                    description="Language used when the user first signs in."
                >
                    <select
                        id="user-language"
                        className={fieldClass}
                        value={form.language}
                        onChange={(e) => updateField('language', e.target.value)}
                    >
                        {Object.entries(data.languages).map(([code, label]) => (
                            <option key={code} value={code}>
                                {label}
                            </option>
                        ))}
                    </select>
                </SettingRow>
            </SettingsSection>

            <SettingsSection title="Permissions" description="Administrative access for this account.">
                <SettingRow
                    label="Administrator"
                    description="Grants full access to the admin area and all servers."
                >
                    <SegmentedControl
                        value={form.root_admin}
                        options={[
                            { value: false, label: 'No' },
                            { value: true, label: 'Yes' },
                        ]}
                        onChange={(value) => updateField('root_admin', value)}
                    />
                </SettingRow>
            </SettingsSection>

            <SettingsSection
                title="Password"
                description="Optional. New users are prompted to set one on first login if left blank."
            >
                <SettingRow label="Password" htmlFor="user-password" description="Leave blank to require setup on login.">
                    <input
                        id="user-password"
                        type="password"
                        autoComplete="new-password"
                        className={fieldClass}
                        value={form.password}
                        onChange={(e) => updateField('password', e.target.value)}
                    />
                </SettingRow>
            </SettingsSection>

            <SettingsFooter>
                <Link to={`${adminPreviewBasePath}/users`} className="no-underline">
                    <Button type="button" variant="outline">
                        Cancel
                    </Button>
                </Link>
                <Button type="submit" disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Creating...' : 'Create user'}
                </Button>
            </SettingsFooter>
        </form>
    );
};
