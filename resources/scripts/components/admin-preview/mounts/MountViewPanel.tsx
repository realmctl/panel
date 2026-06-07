import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useHistory, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/elements/Spinner';
import { Dialog } from '@/components/elements/dialog';
import useFlash from '@/plugins/useFlash';
import {
    attachMountEggs,
    attachMountNodes,
    deleteMount,
    detachMountEgg,
    detachMountNode,
    getMount,
    updateMount,
} from '@/api/admin/mounts';
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
    const mountId = Number(id);
    const history = useHistory();
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data, error, isValidating, mutate } = useSWR(
        Number.isFinite(mountId) ? `admin-mount-${mountId}` : null,
        () => getMount(mountId)
    );
    const [form, setForm] = useState({
        name: '',
        description: '',
        source: '',
        target: '',
        read_only: false,
        user_mountable: false,
    });
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [addEggsOpen, setAddEggsOpen] = useState(false);
    const [addNodesOpen, setAddNodesOpen] = useState(false);
    const [selectedEggs, setSelectedEggs] = useState<number[]>([]);
    const [selectedNodes, setSelectedNodes] = useState<number[]>([]);
    const [working, setWorking] = useState(false);

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-mounts', error });
        } else {
            clearFlashes('admin-mounts');
        }
    }, [error]);

    useEffect(() => {
        if (data?.mount) {
            setForm({
                name: data.mount.name,
                description: data.mount.description ?? '',
                source: data.mount.source,
                target: data.mount.target,
                read_only: data.mount.read_only,
                user_mountable: data.mount.user_mountable,
            });
        }
    }, [data]);

    const onSave = (event: React.FormEvent) => {
        event.preventDefault();
        setSaving(true);
        clearFlashes('admin-mounts');

        updateMount(mountId, {
            ...form,
            read_only: form.read_only ? 1 : 0,
            user_mountable: form.user_mountable ? 1 : 0,
        })
            .then((response) => {
                addFlash({ key: 'admin-mounts', type: 'success', title: 'Mount updated', message: response.message });
                mutate();
            })
            .catch((e) => clearAndAddHttpError({ key: 'admin-mounts', error: e }))
            .finally(() => setSaving(false));
    };

    const onDelete = () => {
        setDeleting(true);
        deleteMount(mountId)
            .then(() => {
                addFlash({ key: 'admin-mounts', type: 'success', title: 'Mount deleted', message: 'Mount removed.' });
                history.push(`${adminPreviewBasePath}/mounts`);
            })
            .catch((e) => {
                clearAndAddHttpError({ key: 'admin-mounts', error: e });
                setConfirmDelete(false);
            })
            .finally(() => setDeleting(false));
    };

    const onAddEggs = () => {
        if (selectedEggs.length === 0) return;
        setWorking(true);
        attachMountEggs(mountId, selectedEggs)
            .then(() => {
                setAddEggsOpen(false);
                setSelectedEggs([]);
                mutate();
            })
            .catch((e) => clearAndAddHttpError({ key: 'admin-mounts', error: e }))
            .finally(() => setWorking(false));
    };

    const onAddNodes = () => {
        if (selectedNodes.length === 0) return;
        setWorking(true);
        attachMountNodes(mountId, selectedNodes)
            .then(() => {
                setAddNodesOpen(false);
                setSelectedNodes([]);
                mutate();
            })
            .catch((e) => clearAndAddHttpError({ key: 'admin-mounts', error: e }))
            .finally(() => setWorking(false));
    };

    const onDetachEgg = (eggId: number) => {
        setWorking(true);
        detachMountEgg(mountId, eggId)
            .then(() => mutate())
            .catch((e) => clearAndAddHttpError({ key: 'admin-mounts', error: e }))
            .finally(() => setWorking(false));
    };

    const onDetachNode = (nodeId: number) => {
        setWorking(true);
        detachMountNode(mountId, nodeId)
            .then(() => mutate())
            .catch((e) => clearAndAddHttpError({ key: 'admin-mounts', error: e }))
            .finally(() => setWorking(false));
    };

    if (!data && isValidating) return <Spinner centered />;
    if (!data) return <p className="text-sm text-muted-foreground">Unable to load mount.</p>;

    const toggleEgg = (eggId: number) => {
        setSelectedEggs((current) =>
            current.includes(eggId) ? current.filter((id) => id !== eggId) : [...current, eggId]
        );
    };

    const toggleNode = (nodeId: number) => {
        setSelectedNodes((current) =>
            current.includes(nodeId) ? current.filter((id) => id !== nodeId) : [...current, nodeId]
        );
    };

    return (
        <>
            <Dialog.Confirm
                appearance="admin"
                title="Delete mount"
                confirm="Delete"
                open={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirmed={onDelete}
            >
                Are you sure you want to delete this mount?
            </Dialog.Confirm>

            <Dialog appearance="admin" open={addEggsOpen} onClose={() => setAddEggsOpen(false)} title="Add eggs">
                <div className="max-h-64 space-y-4 overflow-y-auto">
                    {data.available_eggs.map((nest) =>
                        nest.eggs.length > 0 ? (
                            <div key={nest.id}>
                                <p className="mb-2 text-sm font-medium text-foreground">{nest.name}</p>
                                <div className="space-y-1 pl-2">
                                    {nest.eggs.map((egg) => (
                                        <label key={egg.id} className="flex cursor-pointer items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={selectedEggs.includes(egg.id)}
                                                onChange={() => toggleEgg(egg.id)}
                                            />
                                            {egg.name}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ) : null
                    )}
                </div>
                <div className="mt-4 flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setAddEggsOpen(false)}>
                        Cancel
                    </Button>
                    <Button disabled={working || selectedEggs.length === 0} onClick={onAddEggs}>
                        Add
                    </Button>
                </div>
            </Dialog>

            <Dialog appearance="admin" open={addNodesOpen} onClose={() => setAddNodesOpen(false)} title="Add nodes">
                <div className="max-h-64 space-y-4 overflow-y-auto">
                    {data.available_nodes.map((location) =>
                        location.nodes.length > 0 ? (
                            <div key={location.id}>
                                <p className="mb-2 text-sm font-medium text-foreground">
                                    {location.long || location.short}
                                </p>
                                <div className="space-y-1 pl-2">
                                    {location.nodes.map((node) => (
                                        <label key={node.id} className="flex cursor-pointer items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={selectedNodes.includes(node.id)}
                                                onChange={() => toggleNode(node.id)}
                                            />
                                            {node.name}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ) : null
                    )}
                </div>
                <div className="mt-4 flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setAddNodesOpen(false)}>
                        Cancel
                    </Button>
                    <Button disabled={working || selectedNodes.length === 0} onClick={onAddNodes}>
                        Add
                    </Button>
                </div>
            </Dialog>

            <div className="space-y-6">
                <Link
                    to={`${adminPreviewBasePath}/mounts`}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground no-underline hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to mounts
                </Link>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <form onSubmit={onSave} className="rounded-lg border border-border bg-card">
                        <div className="border-b border-border px-5 py-4">
                            <h2 className="text-base font-semibold text-foreground">Mount details</h2>
                        </div>
                        <div className="space-y-4 p-5">
                            <div className="space-y-2">
                                <Label>Unique ID</Label>
                                <input className={fieldClass} value={data.mount.uuid} readOnly />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="m-name">Name</Label>
                                <input
                                    id="m-name"
                                    className={fieldClass}
                                    value={form.name}
                                    onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="m-desc">Description</Label>
                                <textarea
                                    id="m-desc"
                                    className={fieldClass}
                                    rows={3}
                                    value={form.description}
                                    onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="m-source">Source</Label>
                                    <input
                                        id="m-source"
                                        className={fieldClass}
                                        value={form.source}
                                        onChange={(e) => setForm((c) => ({ ...c, source: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="m-target">Target</Label>
                                    <input
                                        id="m-target"
                                        className={fieldClass}
                                        value={form.target}
                                        onChange={(e) => setForm((c) => ({ ...c, target: e.target.value }))}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Read only</Label>
                                    <select
                                        className={fieldClass}
                                        value={form.read_only ? '1' : '0'}
                                        onChange={(e) =>
                                            setForm((c) => ({ ...c, read_only: e.target.value === '1' }))
                                        }
                                    >
                                        <option value="0">False</option>
                                        <option value="1">True</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>User mountable</Label>
                                    <select
                                        className={fieldClass}
                                        value={form.user_mountable ? '1' : '0'}
                                        onChange={(e) =>
                                            setForm((c) => ({ ...c, user_mountable: e.target.value === '1' }))
                                        }
                                    >
                                        <option value="0">False</option>
                                        <option value="1">True</option>
                                    </select>
                                </div>
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

                    <div className="space-y-6">
                        <div className="rounded-lg border border-border bg-card">
                            <div className="flex items-center justify-between border-b border-border px-5 py-4">
                                <h2 className="text-base font-semibold text-foreground">Eggs</h2>
                                <Button size="sm" disabled={working} onClick={() => setAddEggsOpen(true)}>
                                    Add eggs
                                </Button>
                            </div>
                            {data.eggs.length === 0 ? (
                                <p className="px-5 py-8 text-center text-sm text-muted-foreground">No eggs assigned.</p>
                            ) : (
                                <div className={tableWrapClass}>
                                    <table className={tableClass}>
                                        <thead>
                                            <tr className={tableHeadRowClass}>
                                                <th className={tableHeadCellClass}>ID</th>
                                                <th className={tableHeadCellClass}>Name</th>
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
                                                            className="text-primary no-underline hover:underline"
                                                        >
                                                            {egg.name}
                                                        </Link>
                                                    </td>
                                                    <td className={cn(tableBodyCellClass, 'text-right')}>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            disabled={working}
                                                            onClick={() => onDetachEgg(egg.id)}
                                                        >
                                                            Remove
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="rounded-lg border border-border bg-card">
                            <div className="flex items-center justify-between border-b border-border px-5 py-4">
                                <h2 className="text-base font-semibold text-foreground">Nodes</h2>
                                <Button size="sm" disabled={working} onClick={() => setAddNodesOpen(true)}>
                                    Add nodes
                                </Button>
                            </div>
                            {data.nodes.length === 0 ? (
                                <p className="px-5 py-8 text-center text-sm text-muted-foreground">No nodes assigned.</p>
                            ) : (
                                <div className={tableWrapClass}>
                                    <table className={tableClass}>
                                        <thead>
                                            <tr className={tableHeadRowClass}>
                                                <th className={tableHeadCellClass}>ID</th>
                                                <th className={tableHeadCellClass}>Name</th>
                                                <th className={tableHeadCellClass}>FQDN</th>
                                                <th className={tableHeadCellClass}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.nodes.map((node) => (
                                                <tr key={node.id} className={tableBodyRowClass}>
                                                    <td className={tableBodyCellClass}>
                                                        <code className="text-xs">{node.id}</code>
                                                    </td>
                                                    <td className={tableBodyCellClass}>
                                                        <Link
                                                            to={`${adminPreviewBasePath}/nodes/${node.id}`}
                                                            className="text-primary no-underline hover:underline"
                                                        >
                                                            {node.name}
                                                        </Link>
                                                    </td>
                                                    <td className={tableBodyCellClass}>
                                                        <code className="text-xs">{node.fqdn}</code>
                                                    </td>
                                                    <td className={cn(tableBodyCellClass, 'text-right')}>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            disabled={working}
                                                            onClick={() => onDetachNode(node.id)}
                                                        >
                                                            Remove
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
