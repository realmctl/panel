import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useHistory, useParams } from 'react-router-dom';
import { Download, Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import { Dialog } from '@/components/elements/dialog';
import useFlash from '@/plugins/useFlash';
import { deleteNest, getEggExportUrl, getNest, updateNest } from '@/api/admin/nests';
import { fieldClass, textareaClass } from '@/components/admin-preview/settings/fieldClass';
import { SettingRow, SettingsFooter, SettingsSection } from '@/components/admin-preview/settings/settingsLayout';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';

export default () => {
    const { id } = useParams<{ id: string }>();
    const nestId = Number(id);
    const history = useHistory();
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data, error, isValidating, mutate } = useSWR(
        Number.isFinite(nestId) ? `admin-nest-${nestId}` : null,
        () => getNest(nestId)
    );
    const [form, setForm] = useState({ name: '', description: '' });
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-nests', error });
        } else {
            clearFlashes('admin-nests');
        }
    }, [error]);

    useEffect(() => {
        if (data?.nest) {
            setForm({ name: data.nest.name, description: data.nest.description ?? '' });
        }
    }, [data]);

    const onSave = (event: React.FormEvent) => {
        event.preventDefault();
        setSaving(true);
        clearFlashes('admin-nests');

        updateNest(nestId, form)
            .then((response) => {
                addFlash({ key: 'admin-nests', type: 'success', title: 'Nest updated', message: response.message });
                mutate();
            })
            .catch((submitError) => clearAndAddHttpError({ key: 'admin-nests', error: submitError }))
            .finally(() => setSaving(false));
    };

    const onDelete = () => {
        setDeleting(true);
        deleteNest(nestId)
            .then(() => {
                addFlash({ key: 'admin-nests', type: 'success', title: 'Nest deleted', message: 'Nest removed.' });
                history.push(`${adminPreviewBasePath}/nests`);
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-nests', error: submitError });
                setConfirmDelete(false);
            })
            .finally(() => setDeleting(false));
    };

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    if (!data) {
        return <p className="text-sm text-muted-foreground">Unable to load nest.</p>;
    }

    const { nest } = data;

    return (
        <>
            <Dialog.Confirm
                appearance="admin"
                title="Delete nest"
                confirm="Delete"
                open={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirmed={onDelete}
            >
                Delete this nest and all associated eggs?
            </Dialog.Confirm>

            <div className="mb-4 overflow-hidden rounded-md border border-border bg-card px-5 py-4">
                <h2 className="text-base font-semibold text-foreground">{nest.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    {nest.author} · <code>#{nest.id}</code>
                    {nest.description ? ` · ${nest.description}` : ''}
                </p>
            </div>

            <form onSubmit={onSave} className="space-y-4">
                <SettingsSection title="Details" description="Name and description for this nest.">
                    <SettingRow label="Name" htmlFor="n-name" description="Display name for this nest.">
                        <input
                            id="n-name"
                            className={fieldClass}
                            value={form.name}
                            onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                            required
                        />
                    </SettingRow>
                    <SettingRow
                        label="Description"
                        htmlFor="n-desc"
                        description="Optional summary shown in the admin area."
                        wide
                    >
                        <textarea
                            id="n-desc"
                            className={textareaClass}
                            rows={5}
                            value={form.description}
                            onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
                        />
                    </SettingRow>
                    <SettingRow label="UUID" description="Internal nest identifier.">
                        <code className="block break-all rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-foreground">
                            {nest.uuid}
                        </code>
                    </SettingRow>
                </SettingsSection>

                <SettingsFooter>
                    <Button
                        type="button"
                        variant="outline"
                        className="mr-auto border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={deleting || saving}
                        onClick={() => setConfirmDelete(true)}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete nest
                    </Button>
                    <Link to={`${adminPreviewBasePath}/nests`} className="no-underline">
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
                        <h2 className="text-base font-semibold text-foreground">Eggs</h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Server templates in this nest.
                        </p>
                    </div>
                    <Link to={`${adminPreviewBasePath}/nests/eggs/new`} className="shrink-0 no-underline">
                        <Button size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            New egg
                        </Button>
                    </Link>
                </div>
                {data.eggs.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-muted-foreground">No eggs in this nest yet.</p>
                ) : (
                    <div className="divide-y divide-border">
                        {data.eggs.map((egg) => (
                            <div
                                key={egg.id}
                                className="flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/50"
                            >
                                <Link
                                    to={`${adminPreviewBasePath}/nests/eggs/${egg.id}`}
                                    className="min-w-0 flex-1 no-underline"
                                >
                                    <p className="text-sm font-medium text-foreground">{egg.name}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {egg.description || 'No description'}
                                        {' · '}
                                        {egg.servers_count} {egg.servers_count === 1 ? 'server' : 'servers'}
                                    </p>
                                </Link>
                                <div className="flex shrink-0 items-center gap-3">
                                    <code className="text-xs text-muted-foreground">#{egg.id}</code>
                                    <a
                                        href={getEggExportUrl(egg.id)}
                                        className="text-muted-foreground hover:text-foreground"
                                        title="Export egg"
                                    >
                                        <Download className="h-4 w-4" />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};
