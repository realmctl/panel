import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useParams } from 'react-router-dom';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { getServerDetails, searchUsers, updateServerDetails } from '@/api/admin/servers';
import { fieldClass, textareaClass } from '@/components/admin-preview/settings/fieldClass';
import { SettingRow, SettingsFooter, SettingsSection } from '@/components/admin-preview/settings/settingsLayout';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';

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
                .then((response: any) => setOwnerResults(response.users))
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
            .then((response: any) => {
                addFlash({
                    key: 'admin-servers',
                    type: 'success',
                    title: 'Details saved',
                    message: response.message,
                });
                mutate();
                setOwnerQuery('');
                setOwnerResults([]);
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

    const ownerLink = data.server.owner ? (
        <Link
            to={`${adminPreviewBasePath}/users/${data.server.owner.id}`}
            className="text-blue-400 no-underline hover:text-blue-300"
        >
            {data.server.owner.username}
        </Link>
    ) : null;

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="overflow-hidden rounded-md border border-border bg-card px-5 py-4">
                <h2 className="text-base font-semibold text-foreground">{form.name || data.server.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    <code>#{data.server.id}</code>
                    {ownerLink ? (
                        <>
                            {' · Owner '}
                            {ownerLink}
                        </>
                    ) : null}
                </p>
            </div>

            <SettingsSection title="Details" description="Name, owner, and metadata for this server.">
                <SettingRow label="Server name" htmlFor="server-name" description="Display name shown across the panel.">
                    <input
                        id="server-name"
                        className={fieldClass}
                        value={form.name}
                        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                        required
                    />
                </SettingRow>
                <SettingRow
                    label="External ID"
                    htmlFor="external-id"
                    description="Optional identifier from an external billing or provisioning system."
                >
                    <input
                        id="external-id"
                        className={fieldClass}
                        value={form.external_id}
                        onChange={(event) =>
                            setForm((current) => ({ ...current, external_id: event.target.value }))
                        }
                    />
                </SettingRow>
                <SettingRow
                    label="Owner"
                    htmlFor="owner-search"
                    description="Search by email to transfer ownership to another user."
                >
                    <div className="space-y-2">
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
                                <div className="divide-y divide-border">
                                    {ownerResults.map((user) => (
                                        <button
                                            key={user.id}
                                            type="button"
                                            className="block w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/50"
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
                            </div>
                        )}
                    </div>
                </SettingRow>
                <SettingRow
                    label="Description"
                    htmlFor="description"
                    description="Optional notes visible to administrators."
                    wide
                >
                    <textarea
                        id="description"
                        className={textareaClass}
                        rows={3}
                        value={form.description}
                        onChange={(event) =>
                            setForm((current) => ({ ...current, description: event.target.value }))
                        }
                    />
                </SettingRow>
            </SettingsSection>

            <SettingsFooter>
                <Link to={`${adminPreviewBasePath}/servers/${serverId}`} className="no-underline">
                    <Button type="button" variant="outline" disabled={saving}>
                        Cancel
                    </Button>
                </Link>
                <Button type="submit" disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save changes'}
                </Button>
            </SettingsFooter>
        </form>
    );
};
