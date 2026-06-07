import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useHistory } from 'react-router-dom';
import { ArrowLeft, Info, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { createUser, getUserCreateMeta } from '@/api/admin/users';
import { fieldClass } from '@/components/admin-preview/settings/fieldClass';
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
        <form onSubmit={onSubmit} className="space-y-6">
            <Link
                to={`${adminPreviewBasePath}/users`}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground no-underline hover:text-foreground"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to users
            </Link>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-lg border border-border bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-foreground">Identity</h2>
                    </div>
                    <div className="space-y-5 p-5">
                        <div className="space-y-2">
                            <Label htmlFor="user-email">Email</Label>
                            <input
                                id="user-email"
                                type="email"
                                autoComplete="off"
                                className={fieldClass}
                                value={form.email}
                                onChange={(e) => updateField('email', e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="user-username">Username</Label>
                            <input
                                id="user-username"
                                autoComplete="off"
                                className={fieldClass}
                                value={form.username}
                                onChange={(e) => updateField('username', e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="user-first">First name</Label>
                            <input
                                id="user-first"
                                autoComplete="off"
                                className={fieldClass}
                                value={form.name_first}
                                onChange={(e) => updateField('name_first', e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="user-last">Last name</Label>
                            <input
                                id="user-last"
                                autoComplete="off"
                                className={fieldClass}
                                value={form.name_last}
                                onChange={(e) => updateField('name_last', e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="user-language">Default language</Label>
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
                        </div>
                    </div>
                    <div className="flex justify-end border-t border-border px-5 py-4">
                        <Button type="submit" disabled={saving}>
                            <Save className="mr-2 h-4 w-4" />
                            Create user
                        </Button>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-lg border border-border bg-card">
                        <div className="border-b border-border px-5 py-4">
                            <h2 className="text-base font-semibold text-foreground">Permissions</h2>
                        </div>
                        <div className="space-y-5 p-5">
                            <div className="space-y-2">
                                <Label htmlFor="user-admin">Administrator</Label>
                                <select
                                    id="user-admin"
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

                    <div className="rounded-lg border border-border bg-card">
                        <div className="border-b border-border px-5 py-4">
                            <h2 className="text-base font-semibold text-foreground">Password</h2>
                        </div>
                        <div className="space-y-5 p-5">
                            <div className="flex gap-2 rounded-md border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-muted-foreground">
                                <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                                <p>
                                    Providing a password is optional. New users will be prompted to create one on first
                                    login.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="user-password">Password</Label>
                                <input
                                    id="user-password"
                                    type="password"
                                    className={fieldClass}
                                    value={form.password}
                                    onChange={(e) => updateField('password', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
};
