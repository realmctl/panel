import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useHistory, useParams } from 'react-router-dom';
import { Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/elements/Spinner';
import { Dialog } from '@/components/elements/dialog';
import useFlash from '@/plugins/useFlash';
import { deleteLocation, getLocation, updateLocation } from '@/api/admin/locations';
import { fieldClass, textareaClass } from '@/components/admin-preview/settings/fieldClass';
import {
    tableBodyCellClass,
    tableBodyRowClass,
    tableClass,
    tableHeadCellClass,
    tableHeadRowClass,
    tableWrapClass,
} from '@/components/admin-preview/adminTable';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';
import { cn } from '@/lib/utils';

export default () => {
    const { id } = useParams<{ id: string }>();
    const locationId = Number(id);
    const history = useHistory();
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data, error, isValidating, mutate } = useSWR(
        Number.isFinite(locationId) ? `admin-location-${locationId}` : null,
        () => getLocation(locationId)
    );
    const [short, setShort] = useState('');
    const [long, setLong] = useState('');
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (data?.location) {
            setShort(data.location.short);
            setLong(data.location.long ?? '');
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

        updateLocation(locationId, { short, long })
            .then((response) => {
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
            .then((response) => {
                addFlash({
                    key: 'admin-locations',
                    type: 'success',
                    title: 'Location deleted',
                    message: response.message,
                });
                history.push(`${adminPreviewBasePath}/locations`);
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

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <form onSubmit={onSave}>
                    <div className="rounded-lg border border-border bg-card">
                        <div className="border-b border-border px-5 py-4">
                            <h2 className="text-base font-semibold text-foreground">Location details</h2>
                        </div>
                        <div className="space-y-5 p-5">
                            <div className="space-y-2">
                                <Label htmlFor="location-short-edit">Short code</Label>
                                <input
                                    id="location-short-edit"
                                    className={fieldClass}
                                    value={short}
                                    onChange={(e) => setShort(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location-long-edit">Description</Label>
                                <textarea
                                    id="location-long-edit"
                                    className={textareaClass}
                                    value={long}
                                    onChange={(e) => setLong(e.target.value)}
                                    rows={4}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between border-t border-border px-5 py-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
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
                        </div>
                    </div>
                </form>

                <div className="rounded-lg border border-border bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-foreground">Nodes</h2>
                    </div>
                    {data.nodes.length === 0 ? (
                        <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                            No nodes are assigned to this location.
                        </p>
                    ) : (
                        <div className={tableWrapClass}>
                            <table className={tableClass}>
                                <thead>
                                    <tr className={tableHeadRowClass}>
                                        <th className={tableHeadCellClass}>ID</th>
                                        <th className={tableHeadCellClass}>Name</th>
                                        <th className={tableHeadCellClass}>FQDN</th>
                                        <th className={cn(tableHeadCellClass, 'text-center')}>Servers</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.nodes.map((node) => (
                                        <tr key={node.id} className={tableBodyRowClass}>
                                            <td className={tableBodyCellClass}>
                                                <code className="text-xs text-muted-foreground">{node.id}</code>
                                            </td>
                                            <td className={tableBodyCellClass}>
                                                <a
                                                    href={`/admin/nodes/view/${node.id}`}
                                                    className="font-medium text-primary no-underline hover:underline"
                                                >
                                                    {node.name}
                                                </a>
                                            </td>
                                            <td className={tableBodyCellClass}>
                                                <code className="text-xs">{node.fqdn}</code>
                                            </td>
                                            <td className={cn(tableBodyCellClass, 'text-center')}>
                                                {node.servers_count}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
