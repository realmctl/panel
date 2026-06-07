import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useParams } from 'react-router-dom';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { getServerDetails, searchUsers, updateServerDetails } from '@/api/admin/servers';
import { fieldClass, textareaClass } from '@/components/admin-preview/settings/fieldClass';

export default () => {
    const { id } = useParams<{ id: string }>();
    const serverId = Number(id);
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data, error, isValidating, mutate } = useSWR(
        Number.isFinite(serverId) ? `admin-server-details-${serverId}` : null,
        () => getServerDetails(serverId)
    );
    const [form, setForm] = useState({
        name: '',
        external_id: '',
        owner_id: 0,
        owner_label: '',
        description: '',
    });
    const [ownerQuery, setOwnerQuery] = useState('');
    const [ownerResults, setOwnerResults] = useState<
        { id: number; email: string; username: string; name_first: string; name_last: string }[]
    >([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (data?.server) {
            const server = data.server;
            setForm({
                name: server.name,
                external_id: server.external_id ?? '',
                owner_id: server.owner_id,
                owner_label: server.owner ? `${server.owner.email} (${server.owner.username})` : '',
                description: server.description ?? '',
            });
        }
    }, [data]);

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-servers', error });
        } else {
            clearFlashes('admin-servers');
        }
    }, [error, clearAndAddHttpError, clearFlashes]);

    useEffect(() => {
        if (ownerQuery.trim().length < 2) {
            setOwnerResults([]);
            return;
        }

        const timeout = window.setTimeout(() => {
            searchUsers(ownerQuery.trim())
                .then((response) => setOwnerResults(response.users))
                .catch(() => setOwnerResults([]));
        }, 250);

        return () => window.clearTimeout(timeout);
    }, [ownerQuery]);

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        setSaving(true);
        clearFlashes('admin-servers');

        updateServerDetails(serverId, {
            name: form.name.trim(),
            external_id: form.external_id.trim() || null,
            owner_id: form.owner_id,
            description: form.description.trim() || null,
        })
            .then((response) => {
                addFlash({
                    key: 'admin-servers',
                    type: 'success',
                    title: 'Details saved',
                    message: response.message,
                });
                mutate();
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-servers', error: submitError });
            })
            .finally(() => setSaving(false));
    };

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    if (!data) {
        return <p className="text-sm text-muted-foreground">Unable to load server details.</p>;
    }

    return (
        <form onSubmit={onSubmit} className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
                <h2 className="text-base font-semibold text-foreground">Base information</h2>
            </div>
            <div className="space-y-5 p-5">
                <div className="space-y-2">
                    <Label htmlFor="server-name">Server name</Label>
                    <input
                        id="server-name"
                        className={fieldClass}
                        value={form.name}
                        onChange={(event) => {
                            const value = event.target.value;
                            setForm((current) => ({ ...current, name: value }));
                        }}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="external-id">External identifier</Label>
                    <input
                        id="external-id"
                        className={fieldClass}
                        value={form.external_id}
                        onChange={(event) => {
                            const value = event.target.value;
                            setForm((current) => ({ ...current, external_id: value }));
                        }}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="owner-search">Server owner</Label>
                    <input
                        id="owner-search"
                        className={fieldClass}
                        value={ownerQuery || form.owner_label}
                        onChange={(event) => {
                            const value = event.target.value;
                            setOwnerQuery(value);
                            setForm((current) => ({ ...current, owner_label: value }));
                        }}
                        placeholder="Search by email..."
                    />
                    {ownerResults.length > 0 && (
                        <div className="overflow-hidden rounded-md border border-border bg-background">
                            {ownerResults.map((user) => (
                                <button
                                    key={user.id}
                                    type="button"
                                    className="block w-full border-b border-border px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted"
                                    onClick={() => {
                                        setForm((current) => ({
                                            ...current,
                                            owner_id: user.id,
                                            owner_label: `${user.email} (${user.username})`,
                                        }));
                                        setOwnerQuery('');
                                        setOwnerResults([]);
                                    }}
                                >
                                    <span className="font-medium text-foreground">
                                        {user.name_first} {user.name_last}
                                    </span>
                                    <span className="ml-2 text-muted-foreground">{user.email}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Server description</Label>
                    <textarea
                        id="description"
                        className={textareaClass}
                        rows={3}
                        value={form.description}
                        onChange={(event) => {
                            const value = event.target.value;
                            setForm((current) => ({ ...current, description: value }));
                        }}
                    />
                </div>
            </div>
            <div className="flex justify-end border-t border-border px-5 py-4">
                <Button type="submit" disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Update details'}
                </Button>
            </div>
        </form>
    );
};
