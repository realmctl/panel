import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useHistory, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/elements/Spinner';
import { Dialog } from '@/components/elements/dialog';
import useFlash from '@/plugins/useFlash';
import { deleteNest, getEggExportUrl, getNest, updateNest } from '@/api/admin/nests';
import {
    tableBodyCellClass,
    tableBodyRowClass,
    tableClass,
    tableHeadCellClass,
    tableHeadRowClass,
    tableWrapClass,
} from '@/components/admin-preview/adminTable';
import { fieldClass } from '@/components/admin-preview/settings/fieldClass';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';
import { cn } from '@/lib/utils';

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
        if (error) clearAndAddHttpError({ key: 'admin-nests', error });
        else clearFlashes('admin-nests');
    }, [error]);

    useEffect(() => {
        if (data?.nest) {
            setForm({ name: data.nest.name, description: data.nest.description ?? '' });
        }
    }, [data]);

    const onSave = (event: React.FormEvent) => {
        event.preventDefault();
        setSaving(true);
        updateNest(nestId, form)
            .then((response) => {
                addFlash({ key: 'admin-nests', type: 'success', title: 'Nest updated', message: response.message });
                mutate();
            })
            .catch((e) => clearAndAddHttpError({ key: 'admin-nests', error: e }))
            .finally(() => setSaving(false));
    };

    const onDelete = () => {
        setDeleting(true);
        deleteNest(nestId)
            .then(() => {
                addFlash({ key: 'admin-nests', type: 'success', title: 'Nest deleted', message: 'Nest removed.' });
                history.push(`${adminPreviewBasePath}/nests`);
            })
            .catch((e) => {
                clearAndAddHttpError({ key: 'admin-nests', error: e });
                setConfirmDelete(false);
            })
            .finally(() => setDeleting(false));
    };

    if (!data && isValidating) return <Spinner centered />;
    if (!data) return <p className="text-sm text-muted-foreground">Unable to load nest.</p>;

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

            <div className="space-y-6">
                <Link
                    to={`${adminPreviewBasePath}/nests`}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground no-underline hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to nests
                </Link>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <form onSubmit={onSave} className="rounded-lg border border-border bg-card">
                        <div className="border-b border-border px-5 py-4">
                            <h2 className="text-base font-semibold text-foreground">Nest details</h2>
                        </div>
                        <div className="space-y-4 p-5">
                            <div className="space-y-2">
                                <Label htmlFor="n-name">Name</Label>
                                <input
                                    id="n-name"
                                    className={fieldClass}
                                    value={form.name}
                                    onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="n-desc">Description</Label>
                                <textarea
                                    id="n-desc"
                                    className={fieldClass}
                                    rows={5}
                                    value={form.description}
                                    onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="flex justify-between border-t border-border px-5 py-4">
                            <Button
                                type="button"
                                variant="destructive"
                                disabled={deleting || saving}
                                onClick={() => setConfirmDelete(true)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                            <Button type="submit" disabled={saving || deleting}>
                                <Save className="mr-2 h-4 w-4" />
                                Save
                            </Button>
                        </div>
                    </form>

                    <div className="rounded-lg border border-border bg-card">
                        <div className="border-b border-border px-5 py-4">
                            <h2 className="text-base font-semibold text-foreground">Information</h2>
                        </div>
                        <div className="space-y-4 p-5">
                            <div className="space-y-2">
                                <Label>Nest ID</Label>
                                <input className={fieldClass} value={data.nest.id} readOnly />
                            </div>
                            <div className="space-y-2">
                                <Label>Author</Label>
                                <input className={fieldClass} value={data.nest.author} readOnly />
                            </div>
                            <div className="space-y-2">
                                <Label>UUID</Label>
                                <input className={fieldClass} value={data.nest.uuid} readOnly />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border border-border bg-card">
                    <div className="flex items-center justify-between border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-foreground">Nest eggs</h2>
                        <Link to={`${adminPreviewBasePath}/nests/eggs/new`} className="no-underline">
                            <Button size="sm">
                                <Plus className="mr-2 h-4 w-4" />
                                New egg
                            </Button>
                        </Link>
                    </div>
                    {data.eggs.length === 0 ? (
                        <p className="px-5 py-8 text-center text-sm text-muted-foreground">No eggs in this nest.</p>
                    ) : (
                        <div className={tableWrapClass}>
                            <table className={tableClass}>
                                <thead>
                                    <tr className={tableHeadRowClass}>
                                        <th className={tableHeadCellClass}>ID</th>
                                        <th className={tableHeadCellClass}>Name</th>
                                        <th className={tableHeadCellClass}>Description</th>
                                        <th className={cn(tableHeadCellClass, 'text-center')}>Servers</th>
                                        <th className={tableHeadCellClass}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.eggs.map((egg) => (
                                        <tr key={egg.id} className={tableBodyRowClass}>
                                            <td className={tableBodyCellClass}>
                                                <code className="text-xs">{egg.id}</code>
                                            </td>
                                            <td className={tableBodyCellClass}>
                                                <Link
                                                    to={`${adminPreviewBasePath}/nests/eggs/${egg.id}`}
                                                    className="font-medium text-primary no-underline hover:underline"
                                                >
                                                    {egg.name}
                                                </Link>
                                            </td>
                                            <td className={cn(tableBodyCellClass, 'text-muted-foreground')}>
                                                {egg.description || '—'}
                                            </td>
                                            <td className={cn(tableBodyCellClass, 'text-center')}>
                                                {egg.servers_count}
                                            </td>
                                            <td className={tableBodyCellClass}>
                                                <a
                                                    href={getEggExportUrl(egg.id)}
                                                    className="inline-flex text-primary no-underline hover:underline"
                                                    title="Export"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </a>
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
