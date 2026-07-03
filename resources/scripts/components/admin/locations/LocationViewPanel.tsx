import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useHistory, useParams } from 'react-router-dom';
import { Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import { Dialog } from '@/components/elements/dialog';
import useFlash from '@/plugins/useFlash';
import { deleteLocation, getLocation, updateLocation } from '@/api/admin/locations';
import { getBackupDestinations } from '@/api/admin/backupDestinations';
import { fieldClass, selectClass, textareaClass } from '@/components/admin/settings/fieldClass';
import { SettingRow, SettingsFooter, SettingsSection } from '@/components/admin/settings/settingsLayout';
import { adminBasePath } from '@/routers/adminRoutes';

export default () => {
    const { id } = useParams<{ id: string }>();
    const locationId = Number(id);
    const history = useHistory();
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data, error, isValidating, mutate } = useSWR(
        Number.isFinite(locationId) ? `admin-location-${locationId}` : null,
        () => getLocation(locationId)
    );
    const { data: destinationsData } = useSWR('admin-backup-destinations', getBackupDestinations);
    const [short, setShort] = useState('');
    const [long, setLong] = useState('');
    const [backupDestinationId, setBackupDestinationId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (data?.location) {
            setShort(data.location.short);
            setLong(data.location.long ?? '');
            setBackupDestinationId(data.location.backup_destination_id);
        }
    }, [data]);

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-locations', error });
        } else {
            clearFlashes('admin-locations');
        }
    }, [error]);

    const onSave = (event: React.FormEvent) => {
        event.preventDefault();

        setSaving(true);
        clearFlashes('admin-locations');

        updateLocation(locationId, { short, long, backup_destination_id: backupDestinationId })
            .then((response: any) => {
                addFlash({
                    key: 'admin-locations',
                    type: 'success',
                    title: 'Location saved',
                    message: response.message,
                });
                mutate();
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-locations', error: submitError });
            })
            .finally(() => setSaving(false));
    };

    const onDelete = () => {
        setDeleting(true);
        clearFlashes('admin-locations');

        deleteLocation(locationId)
            .then((response: any) => {
                addFlash({
                    key: 'admin-locations',
                    type: 'success',
                    title: 'Location deleted',
                    message: response.message,
                });
                history.push(`${adminBasePath}/locations`);
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-locations', error: submitError });
                setConfirmDelete(false);
            })
            .finally(() => setDeleting(false));
    };

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    if (!data) {
        return <p className="text-sm text-muted-foreground">Unable to load location.</p>;
    }

    return (
        <>
            <Dialog.Confirm
                appearance="admin"
                title="Delete location"
                confirm="Delete"
                open={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirmed={onDelete}
            >
                This will permanently delete this location. This action cannot be undone.
            </Dialog.Confirm>

            <form onSubmit={onSave} className="space-y-4">
                <SettingsSection
                    title="Location details"
                    description="Short code and description for this grouping."
                >
                    <SettingRow
                        label="Short code"
                        htmlFor="location-short-edit"
                        description="A short identifier, e.g. us.nyc.lvl3 (1–60 characters)."
                    >
                        <input
                            id="location-short-edit"
                            className={fieldClass}
                            value={short}
                            onChange={(e) => setShort(e.target.value)}
                            required
                        />
                    </SettingRow>
                    <SettingRow
                        label="Description"
                        htmlFor="location-long-edit"
                        description="Optional longer description (max 191 characters)."
                        wide
                    >
                        <textarea
                            id="location-long-edit"
                            className={textareaClass}
                            value={long}
                            onChange={(e) => setLong(e.target.value)}
                            rows={3}
                        />
                    </SettingRow>
                    <SettingRow
                        label="Backup destination"
                        htmlFor="location-backup-destination-edit"
                        description="Servers in this location will store backups here instead of the global default."
                    >
                        <select
                            id="location-backup-destination-edit"
                            className={selectClass}
                            value={backupDestinationId ?? ''}
                            onChange={(e) => setBackupDestinationId(e.target.value ? Number(e.target.value) : null)}
                        >
                            <option value="">Use global default</option>
                            {(destinationsData?.backup_destinations ?? []).map((destination) => (
                                <option key={destination.id} value={destination.id}>
                                    {destination.name}
                                </option>
                            ))}
                        </select>
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
                        Delete
                    </Button>
                    <Button type="submit" disabled={saving || deleting}>
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? 'Saving...' : 'Save changes'}
                    </Button>
                </SettingsFooter>
            </form>

            <div className="mt-4 overflow-hidden rounded-md border border-border bg-card">
                <div className="border-b border-border px-5 py-4">
                    <h2 className="text-base font-semibold text-foreground">Nodes</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {data.nodes.length === 0
                            ? 'No nodes in this location.'
                            : `${data.nodes.length} node${data.nodes.length === 1 ? '' : 's'} in this location`}
                    </p>
                </div>
                {data.nodes.length > 0 && (
                    <div className="divide-y divide-border">
                        {data.nodes.map((node) => (
                            <Link
                                key={node.id}
                                to={`${adminBasePath}/nodes/${node.id}`}
                                className="flex items-center justify-between gap-4 px-5 py-4 no-underline transition-colors hover:bg-muted/50"
                            >
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground">{node.name}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        <code className="text-foreground">{node.fqdn}</code>
                                        {' · '}
                                        {node.servers_count}{' '}
                                        {node.servers_count === 1 ? 'server' : 'servers'}
                                    </p>
                                </div>
                                <code className="shrink-0 text-xs text-muted-foreground">#{node.id}</code>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};
