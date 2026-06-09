import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useHistory, useParams } from 'react-router-dom';
import { Plus, Save, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { fieldClass, textareaClass } from '@/components/admin/settings/fieldClass';
import {
    SegmentedControl,
    SettingRow,
    SettingsFooter,
    SettingsSection,
} from '@/components/admin/settings/settingsLayout';
import { adminBasePath } from '@/routers/adminRoutes';

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

    const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const onSave = (event: React.FormEvent) => {
        event.preventDefault();
        setSaving(true);
        clearFlashes('admin-mounts');

        updateMount(mountId, {
            ...form,
            read_only: form.read_only ? 1 : 0,
            user_mountable: form.user_mountable ? 1 : 0,
        })
            .then((response: any) => {
                addFlash({ key: 'admin-mounts', type: 'success', title: 'Mount updated', message: response.message });
                mutate();
            })
            .catch((submitError) => clearAndAddHttpError({ key: 'admin-mounts', error: submitError }))
            .finally(() => setSaving(false));
    };

    const onDelete = () => {
        setDeleting(true);
        deleteMount(mountId)
            .then(() => {
                addFlash({ key: 'admin-mounts', type: 'success', title: 'Mount deleted', message: 'Mount removed.' });
                history.push(`${adminBasePath}/mounts`);
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-mounts', error: submitError });
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
            .catch((submitError) => clearAndAddHttpError({ key: 'admin-mounts', error: submitError }))
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
            .catch((submitError) => clearAndAddHttpError({ key: 'admin-mounts', error: submitError }))
            .finally(() => setWorking(false));
    };

    const onDetachEgg = (eggId: number) => {
        setWorking(true);
        detachMountEgg(mountId, eggId)
            .then(() => mutate())
            .catch((submitError) => clearAndAddHttpError({ key: 'admin-mounts', error: submitError }))
            .finally(() => setWorking(false));
    };

    const onDetachNode = (nodeId: number) => {
        setWorking(true);
        detachMountNode(mountId, nodeId)
            .then(() => mutate())
            .catch((submitError) => clearAndAddHttpError({ key: 'admin-mounts', error: submitError }))
            .finally(() => setWorking(false));
    };

    const toggleEgg = (eggId: number) => {
        setSelectedEggs((current) =>
            current.includes(eggId) ? current.filter((value) => value !== eggId) : [...current, eggId]
        );
    };

    const toggleNode = (nodeId: number) => {
        setSelectedNodes((current) =>
            current.includes(nodeId) ? current.filter((value) => value !== nodeId) : [...current, nodeId]
        );
    };

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    if (!data) {
        return <p className="text-sm text-muted-foreground">Unable to load mount.</p>;
    }

    const { mount } = data;

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
                <div className="max-h-64 overflow-y-auto rounded-md border border-border p-3">
                    {data.available_eggs.every((nest) => nest.eggs.length === 0) ? (
                        <p className="text-sm text-muted-foreground">No eggs available to add.</p>
                    ) : (
                        <div className="space-y-4">
                            {data.available_eggs.map((nest) =>
                                nest.eggs.length > 0 ? (
                                    <div key={nest.id}>
                                        <p className="mb-2 text-sm font-medium text-foreground">{nest.name}</p>
                                        <div className="space-y-2 pl-1">
                                            {nest.eggs.map((egg) => (
                                                <label
                                                    key={egg.id}
                                                    className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-border"
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
                    )}
                </div>
                <Dialog.Footer>
                    <Button variant="outline" onClick={() => setAddEggsOpen(false)}>
                        Cancel
                    </Button>
                    <Button disabled={working || selectedEggs.length === 0} onClick={onAddEggs}>
                        Add eggs
                    </Button>
                </Dialog.Footer>
            </Dialog>

            <Dialog appearance="admin" open={addNodesOpen} onClose={() => setAddNodesOpen(false)} title="Add nodes">
                <div className="max-h-64 overflow-y-auto rounded-md border border-border p-3">
                    {data.available_nodes.every((location) => location.nodes.length === 0) ? (
                        <p className="text-sm text-muted-foreground">No nodes available to add.</p>
                    ) : (
                        <div className="space-y-4">
                            {data.available_nodes.map((location) =>
                                location.nodes.length > 0 ? (
                                    <div key={location.id}>
                                        <p className="mb-2 text-sm font-medium text-foreground">
                                            {location.long || location.short}
                                        </p>
                                        <div className="space-y-2 pl-1">
                                            {location.nodes.map((node) => (
                                                <label
                                                    key={node.id}
                                                    className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-border"
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
                    )}
                </div>
                <Dialog.Footer>
                    <Button variant="outline" onClick={() => setAddNodesOpen(false)}>
                        Cancel
                    </Button>
                    <Button disabled={working || selectedNodes.length === 0} onClick={onAddNodes}>
                        Add nodes
                    </Button>
                </Dialog.Footer>
            </Dialog>

            <div className="mb-4 overflow-hidden rounded-md border border-border bg-card px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-foreground">{mount.name}</h2>
                    {mount.read_only && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                            Read only
                        </span>
                    )}
                    {mount.user_mountable && (
                        <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                            User mountable
                        </span>
                    )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                    <code>{mount.source}</code> → <code>{mount.target}</code> · <code>#{mount.id}</code>
                </p>
            </div>

            <form onSubmit={onSave} className="space-y-4">
                <SettingsSection title="Details" description="Paths and options for this mount.">
                    <SettingRow label="UUID" description="Internal mount identifier.">
                        <code className="block break-all rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-foreground">
                            {mount.uuid}
                        </code>
                    </SettingRow>
                    <SettingRow label="Name" htmlFor="m-name" description="Label shown in the admin area.">
                        <input
                            id="m-name"
                            className={fieldClass}
                            value={form.name}
                            onChange={(e) => updateField('name', e.target.value)}
                            required
                        />
                    </SettingRow>
                    <SettingRow
                        label="Description"
                        htmlFor="m-desc"
                        description="Optional notes about this mount."
                        wide
                    >
                        <textarea
                            id="m-desc"
                            className={textareaClass}
                            rows={3}
                            value={form.description}
                            onChange={(e) => updateField('description', e.target.value)}
                        />
                    </SettingRow>
                    <SettingRow label="Paths" description="Host source and container target.">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <input
                                id="m-source"
                                className={fieldClass}
                                value={form.source}
                                onChange={(e) => updateField('source', e.target.value)}
                                placeholder="Source"
                                required
                                aria-label="Source path"
                            />
                            <input
                                id="m-target"
                                className={fieldClass}
                                value={form.target}
                                onChange={(e) => updateField('target', e.target.value)}
                                placeholder="Target"
                                required
                                aria-label="Target path"
                            />
                        </div>
                    </SettingRow>
                    <SettingRow label="Read only" description="Prevent the container from writing to this mount.">
                        <SegmentedControl
                            value={form.read_only}
                            options={[
                                { value: false, label: 'No' },
                                { value: true, label: 'Yes' },
                            ]}
                            onChange={(value) => updateField('read_only', value)}
                        />
                    </SettingRow>
                    <SettingRow
                        label="User mountable"
                        description="Allow customers to attach this mount to their servers."
                    >
                        <SegmentedControl
                            value={form.user_mountable}
                            options={[
                                { value: false, label: 'No' },
                                { value: true, label: 'Yes' },
                            ]}
                            onChange={(value) => updateField('user_mountable', value)}
                        />
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
                        Delete mount
                    </Button>
                    <Link to={`${adminBasePath}/mounts`} className="no-underline">
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

            <div className="mt-4 space-y-4">
                <div className="overflow-hidden rounded-md border border-border bg-card">
                    <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-foreground">Eggs</h2>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                Servers using these eggs can use this mount.
                            </p>
                        </div>
                        <Button type="button" size="sm" disabled={working} onClick={() => setAddEggsOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add eggs
                        </Button>
                    </div>
                    {data.eggs.length === 0 ? (
                        <p className="px-5 py-8 text-sm text-muted-foreground">No eggs assigned to this mount.</p>
                    ) : (
                        <div className="divide-y divide-border">
                            {data.eggs.map((egg) => (
                                <div
                                    key={egg.id}
                                    className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/50"
                                >
                                    <Link
                                        to={`${adminBasePath}/nests/eggs/${egg.id}`}
                                        className="min-w-0 flex-1 no-underline"
                                    >
                                        <p className="text-sm font-medium text-foreground">{egg.name}</p>
                                    </Link>
                                    <div className="flex shrink-0 items-center gap-3">
                                        <code className="text-xs text-muted-foreground">#{egg.id}</code>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            disabled={working}
                                            onClick={() => onDetachEgg(egg.id)}
                                            title="Remove"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="overflow-hidden rounded-md border border-border bg-card">
                    <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-foreground">Nodes</h2>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                Mount is only available on assigned nodes.
                            </p>
                        </div>
                        <Button type="button" size="sm" disabled={working} onClick={() => setAddNodesOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add nodes
                        </Button>
                    </div>
                    {data.nodes.length === 0 ? (
                        <p className="px-5 py-8 text-sm text-muted-foreground">No nodes assigned to this mount.</p>
                    ) : (
                        <div className="divide-y divide-border">
                            {data.nodes.map((node) => (
                                <div
                                    key={node.id}
                                    className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/50"
                                >
                                    <Link
                                        to={`${adminBasePath}/nodes/${node.id}`}
                                        className="min-w-0 flex-1 no-underline"
                                    >
                                        <p className="text-sm font-medium text-foreground">{node.name}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            <code className="text-foreground">{node.fqdn}</code>
                                        </p>
                                    </Link>
                                    <div className="flex shrink-0 items-center gap-3">
                                        <code className="text-xs text-muted-foreground">#{node.id}</code>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            disabled={working}
                                            onClick={() => onDetachNode(node.id)}
                                            title="Remove"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
