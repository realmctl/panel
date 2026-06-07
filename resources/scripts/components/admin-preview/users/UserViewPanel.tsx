import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useHistory, useParams } from 'react-router-dom';
import { ArrowLeft, Lock, LockOpen, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/elements/Spinner';
import { Dialog } from '@/components/elements/dialog';
import useFlash from '@/plugins/useFlash';
import { deleteUser, getUser, updateUser } from '@/api/admin/users';
import { fieldClass } from '@/components/admin-preview/settings/fieldClass';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';

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
            .then((response) => {
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

            <form onSubmit={onSave} className="space-y-6">
                <Link
                    to={`${adminPreviewBasePath}/users`}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground no-underline hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to users
                </Link>

                <div className="flex items-center gap-4">
                    <img
                        src={`https://www.gravatar.com/avatar/${user.gravatar_hash}?s=80`}
                        alt=""
                        className="h-12 w-12 rounded-full"
                    />
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">
                            {user.name_first} {user.name_last}
                        </h2>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                        {user.use_totp ? (
                            <>
                                <Lock className="h-4 w-4 text-green-500" />
                                2FA enabled
                            </>
                        ) : (
                            <>
                                <LockOpen className="h-4 w-4 text-red-500" />
                                2FA disabled
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="rounded-lg border border-border bg-card">
                        <div className="border-b border-border px-5 py-4">
                            <h2 className="text-base font-semibold text-foreground">Identity</h2>
                        </div>
                        <div className="space-y-5 p-5">
                            <div className="space-y-2">
                                <Label htmlFor="edit-email">Email</Label>
                                <input
                                    id="edit-email"
                                    type="email"
                                    autoComplete="off"
                                    className={fieldClass}
                                    value={form.email}
                                    onChange={(e) => updateField('email', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-username">Username</Label>
                                <input
                                    id="edit-username"
                                    autoComplete="off"
                                    className={fieldClass}
                                    value={form.username}
                                    onChange={(e) => updateField('username', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-first">First name</Label>
                                <input
                                    id="edit-first"
                                    autoComplete="off"
                                    className={fieldClass}
                                    value={form.name_first}
                                    onChange={(e) => updateField('name_first', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-last">Last name</Label>
                                <input
                                    id="edit-last"
                                    autoComplete="off"
                                    className={fieldClass}
                                    value={form.name_last}
                                    onChange={(e) => updateField('name_last', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-language">Default language</Label>
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
                            </div>
                        </div>
                        <div className="flex justify-end border-t border-border px-5 py-4">
                            <Button type="submit" disabled={saving || deleting}>
                                <Save className="mr-2 h-4 w-4" />
                                Update user
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-lg border border-border bg-card">
                            <div className="border-b border-border px-5 py-4">
                                <h2 className="text-base font-semibold text-foreground">Password</h2>
                            </div>
                            <div className="space-y-5 p-5">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-password">Password</Label>
                                    <input
                                        id="edit-password"
                                        type="password"
                                        autoComplete="off"
                                        className={fieldClass}
                                        value={form.password}
                                        onChange={(e) => updateField('password', e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Leave blank to keep the current password. User will not be notified of changes.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border border-border bg-card">
                            <div className="border-b border-border px-5 py-4">
                                <h2 className="text-base font-semibold text-foreground">Permissions</h2>
                            </div>
                            <div className="space-y-5 p-5">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-admin">Administrator</Label>
                                    <select
                                        id="edit-admin"
                                        className={fieldClass}
                                        value={form.root_admin ? '1' : '0'}
                                        onChange={(e) => updateField('root_admin', e.target.value === '1')}
                                    >
                                        <option value="0">No</option>
                                        <option value="1">Yes</option>
                                    </select>
                                    <p className="text-xs text-muted-foreground">
                                        Setting this to &quot;Yes&quot; gives a user full administrative access.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            <div className="rounded-lg border border-destructive/50 bg-card">
                <div className="border-b border-destructive/30 px-5 py-4">
                    <h2 className="text-base font-semibold text-destructive">Delete user</h2>
                </div>
                <div className="px-5 py-4">
                    <p className="text-sm text-muted-foreground">
                        There must be no servers associated with this account in order for it to be deleted.
                        {user.servers_count > 0 && (
                            <>
                                {' '}
                                This user currently owns{' '}
                                <Link
                                    to={`${adminPreviewBasePath}/servers?owner_id=${user.id}`}
                                    className="text-primary no-underline hover:underline"
                                >
                                    {user.servers_count} server{user.servers_count === 1 ? '' : 's'}
                                </Link>
                                .
                            </>
                        )}
                    </p>
                </div>
                <div className="flex justify-end border-t border-destructive/30 px-5 py-4">
                    <Button
                        variant="destructive"
                        disabled={!can_delete || deleting}
                        onClick={() => setConfirmDelete(true)}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete user
                    </Button>
                </div>
            </div>
        </>
    );
};
