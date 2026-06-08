import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useHistory, useParams } from 'react-router-dom';
import { Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import { Dialog } from '@/components/elements/dialog';
import useFlash from '@/plugins/useFlash';
import { deleteUser, getUser, updateUser } from '@/api/admin/users';
import { fieldClass } from '@/components/admin-preview/settings/fieldClass';
import {
    SegmentedControl,
    SettingRow,
    SettingsFooter,
    SettingsSection,
} from '@/components/admin-preview/settings/settingsLayout';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';
import { cn } from '@/lib/utils';

export default () => {
    const { id } = useParams<{ id: string }>();
    const userId = Number(id);
    const history = useHistory();
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data, error, isValidating, mutate } = useSWR(
        Number.isFinite(userId) ? `admin-user-${userId}` : null,
        () => getUser(userId)
    );
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
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-users', error });
        } else {
            clearFlashes('admin-users');
        }
    }, [error]);

    useEffect(() => {
        if (data?.user) {
            setForm({
                email: data.user.email,
                username: data.user.username,
                name_first: data.user.name_first,
                name_last: data.user.name_last,
                language: data.user.language,
                root_admin: data.user.root_admin,
                password: '',
            });
        }
    }, [data]);

    const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const onSave = (event: React.FormEvent) => {
        event.preventDefault();

        setSaving(true);
        clearFlashes('admin-users');

        const payload: Record<string, unknown> = {
            email: form.email,
            username: form.username,
            name_first: form.name_first,
            name_last: form.name_last,
            language: form.language,
            root_admin: form.root_admin ? 1 : 0,
        };

        if (form.password) {
            payload.password = form.password;
        }

        updateUser(userId, payload)
            .then((response: any) => {
                addFlash({
                    key: 'admin-users',
                    type: 'success',
                    title: 'User updated',
                    message: response.message,
                });
                mutate();
                setForm((current) => ({ ...current, password: '' }));
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-users', error: submitError });
            })
            .finally(() => setSaving(false));
    };

    const onDelete = () => {
        setDeleting(true);
        clearFlashes('admin-users');

        deleteUser(userId)
            .then(() => {
                addFlash({
                    key: 'admin-users',
                    type: 'success',
                    title: 'User deleted',
                    message: 'The user account was removed from the panel.',
                });
                history.push(`${adminPreviewBasePath}/users`);
            })
            .catch((deleteError) => {
                clearAndAddHttpError({ key: 'admin-users', error: deleteError });
                setConfirmDelete(false);
            })
            .finally(() => setDeleting(false));
    };

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    if (!data) {
        return <p className="text-sm text-muted-foreground">Unable to load user.</p>;
    }

    const { user, languages, can_delete } = data;
    const displayName = `${user.name_first} ${user.name_last}`.trim() || user.username;

    return (
        <>
            <Dialog.Confirm
                appearance="admin"
                title="Delete user"
                confirm="Delete"
                open={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirmed={onDelete}
            >
                Are you sure you want to delete this user? This action cannot be undone.
            </Dialog.Confirm>

            <div className="mb-4 overflow-hidden rounded-md border border-border bg-card px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-foreground">{displayName}</h2>
                    {user.root_admin && (
                        <span className="rounded bg-yellow-500/15 px-1.5 py-0.5 text-xs font-medium text-yellow-600 dark:text-yellow-500">
                            Admin
                        </span>
                    )}
                    <span
                        className={cn(
                            'rounded px-1.5 py-0.5 text-xs font-medium',
                            user.use_totp
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                : 'bg-muted text-muted-foreground'
                        )}
                    >
                        {user.use_totp ? '2FA on' : '2FA off'}
                    </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                    {user.email} · @{user.username} · <code>#{user.id}</code>
                </p>
            </div>

            <form onSubmit={onSave} className="space-y-4">
                <SettingsSection title="Profile" description="Account identity and display preferences.">
                    <SettingRow label="Email" htmlFor="edit-email" description="Used to sign in to the panel.">
                        <input
                            id="edit-email"
                            type="email"
                            autoComplete="off"
                            className={fieldClass}
                            value={form.email}
                            onChange={(e) => updateField('email', e.target.value)}
                            required
                        />
                    </SettingRow>
                    <SettingRow label="Username" htmlFor="edit-username" description="Public handle across the panel.">
                        <input
                            id="edit-username"
                            autoComplete="off"
                            className={fieldClass}
                            value={form.username}
                            onChange={(e) => updateField('username', e.target.value)}
                            required
                        />
                    </SettingRow>
                    <SettingRow label="First name" htmlFor="edit-first" description="Shown in account details.">
                        <input
                            id="edit-first"
                            autoComplete="off"
                            className={fieldClass}
                            value={form.name_first}
                            onChange={(e) => updateField('name_first', e.target.value)}
                            required
                        />
                    </SettingRow>
                    <SettingRow label="Last name" htmlFor="edit-last" description="Shown in account details.">
                        <input
                            id="edit-last"
                            autoComplete="off"
                            className={fieldClass}
                            value={form.name_last}
                            onChange={(e) => updateField('name_last', e.target.value)}
                            required
                        />
                    </SettingRow>
                    <SettingRow
                        label="Language"
                        htmlFor="edit-language"
                        description="Default panel language for this user."
                    >
                        <select
                            id="edit-language"
                            className={fieldClass}
                            value={form.language}
                            onChange={(e) => updateField('language', e.target.value)}
                        >
                            {Object.entries(languages).map(([code, label]) => (
                                <option key={code} value={code}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </SettingRow>
                    <SettingRow label="UUID" description="Internal account identifier.">
                        <code className="block break-all rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-foreground">
                            {user.uuid}
                        </code>
                    </SettingRow>
                </SettingsSection>

                <SettingsSection title="Access" description="Credentials and administrative permissions.">
                    <SettingRow
                        label="New password"
                        htmlFor="edit-password"
                        description="Leave blank to keep the current password. The user is not notified."
                    >
                        <input
                            id="edit-password"
                            type="password"
                            autoComplete="new-password"
                            className={fieldClass}
                            value={form.password}
                            onChange={(e) => updateField('password', e.target.value)}
                        />
                    </SettingRow>
                    <SettingRow
                        label="Administrator"
                        description="Full access to the admin area and every server on the panel."
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

                <SettingsFooter>
                    <Button
                        type="button"
                        variant="outline"
                        className="mr-auto border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={!can_delete || deleting || saving}
                        onClick={() => setConfirmDelete(true)}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete user
                    </Button>
                    <Link to={`${adminPreviewBasePath}/users`} className="no-underline">
                        <Button type="button" variant="outline" disabled={saving || deleting}>
                            Cancel
                        </Button>
                    </Link>
                    <Button type="submit" disabled={saving || deleting}>
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? 'Saving...' : 'Save changes'}
                    </Button>
                </SettingsFooter>
            </form>

            <div className="mt-4 overflow-hidden rounded-md border border-border bg-card">
                <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-foreground">Servers</h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {user.servers_count === 0
                                ? 'This user does not own any servers.'
                                : `Owns ${user.servers_count} server${user.servers_count === 1 ? '' : 's'}.`}
                        </p>
                    </div>
                    {user.servers_count > 0 && (
                        <Link
                            to={`${adminPreviewBasePath}/servers?owner_id=${user.id}`}
                            className="shrink-0 no-underline"
                        >
                            <Button type="button" variant="outline" size="sm">
                                View servers
                            </Button>
                        </Link>
                    )}
                </div>
                {!can_delete && user.servers_count > 0 && (
                    <p className="px-5 py-4 text-sm text-muted-foreground">
                        Transfer or delete owned servers before removing this account.
                    </p>
                )}
            </div>
        </>
    );
};
