import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useHistory } from 'react-router-dom';
import { Folder, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/elements/Spinner';
import { Dialog } from '@/components/elements/dialog';
import useFlash from '@/plugins/useFlash';
import { createMount, getMounts, MountStorePayload } from '@/api/admin/mounts';
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

const defaultForm = (): MountStorePayload => ({
    name: '',
    description: '',
    source: '',
    target: '',
    read_only: false,
    user_mountable: false,
});

export default () => {
    const history = useHistory();
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data, error, isValidating, mutate } = useSWR('admin-mounts', getMounts);
    const [createOpen, setCreateOpen] = useState(false);
    const [form, setForm] = useState(defaultForm);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-mounts', error });
        } else {
            clearFlashes('admin-mounts');
        }
    }, [error]);

    const updateField = <K extends keyof MountStorePayload>(key: K, value: MountStorePayload[K]) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const onCreate = (event: React.FormEvent) => {
        event.preventDefault();

        setSaving(true);
        clearFlashes('admin-mounts');

        createMount({
            ...form,
            read_only: form.read_only ? 1 : 0,
            user_mountable: form.user_mountable ? 1 : 0,
        })
            .then((response) => {
                addFlash({
                    key: 'admin-mounts',
                    type: 'success',
                    title: 'Mount created',
                    message: response.message,
                });
                setCreateOpen(false);
                setForm(defaultForm());
                mutate();
                history.push(`${adminPreviewBasePath}/mounts/${response.mount!.id}`);
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-mounts', error: submitError });
            })
            .finally(() => setSaving(false));
    };

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    const mounts = data?.mounts ?? [];

    return (
        <>
            <Dialog appearance="admin" open={createOpen} onClose={() => setCreateOpen(false)} title="Create mount">
                <form onSubmit={onCreate} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="mount-name">Name</Label>
                        <input
                            id="mount-name"
                            className={fieldClass}
                            value={form.name}
                            onChange={(e) => updateField('name', e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="mount-description">Description</Label>
                        <textarea
                            id="mount-description"
                            className={fieldClass}
                            rows={3}
                            value={form.description}
                            onChange={(e) => updateField('description', e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="mount-source">Source</Label>
                            <input
                                id="mount-source"
                                className={fieldClass}
                                value={form.source}
                                onChange={(e) => updateField('source', e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="mount-target">Target</Label>
                            <input
                                id="mount-target"
                                className={fieldClass}
                                value={form.target}
                                onChange={(e) => updateField('target', e.target.value)}
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
                                onChange={(e) => updateField('read_only', e.target.value === '1')}
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
                                onChange={(e) => updateField('user_mountable', e.target.value === '1')}
                            >
                                <option value="0">False</option>
                                <option value="1">True</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            Create
                        </Button>
                    </div>
                </form>
            </Dialog>

            <div className="rounded-lg border border-border bg-card">
                <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-foreground">Mount list</h2>
                        <p className="mt-1 text-sm text-muted-foreground">Bind host paths into server containers.</p>
                    </div>
                    <Button onClick={() => setCreateOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create new
                    </Button>
                </div>

                {mounts.length === 0 ? (
                    <div className="flex flex-col items-center px-5 py-12 text-center">
                        <Folder className="mb-4 h-10 w-10 text-muted-foreground" />
                        <p className="text-base font-medium text-foreground">No mounts</p>
                        <Button className="mt-5" onClick={() => setCreateOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create new
                        </Button>
                    </div>
                ) : (
                    <div className={tableWrapClass}>
                        <table className={tableClass}>
                            <thead>
                                <tr className={tableHeadRowClass}>
                                    <th className={tableHeadCellClass}>ID</th>
                                    <th className={tableHeadCellClass}>Name</th>
                                    <th className={tableHeadCellClass}>Source</th>
                                    <th className={tableHeadCellClass}>Target</th>
                                    <th className={cn(tableHeadCellClass, 'text-center')}>Eggs</th>
                                    <th className={cn(tableHeadCellClass, 'text-center')}>Nodes</th>
                                    <th className={cn(tableHeadCellClass, 'text-center')}>Servers</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mounts.map((mount) => (
                                    <tr key={mount.id} className={tableBodyRowClass}>
                                        <td className={tableBodyCellClass}>
                                            <code className="text-xs text-muted-foreground">{mount.id}</code>
                                        </td>
                                        <td className={tableBodyCellClass}>
                                            <Link
                                                to={`${adminPreviewBasePath}/mounts/${mount.id}`}
                                                className="font-medium text-primary no-underline hover:underline"
                                            >
                                                {mount.name}
                                            </Link>
                                        </td>
                                        <td className={tableBodyCellClass}>
                                            <code className="text-xs">{mount.source}</code>
                                        </td>
                                        <td className={tableBodyCellClass}>
                                            <code className="text-xs">{mount.target}</code>
                                        </td>
                                        <td className={cn(tableBodyCellClass, 'text-center')}>{mount.eggs_count}</td>
                                        <td className={cn(tableBodyCellClass, 'text-center')}>{mount.nodes_count}</td>
                                        <td className={cn(tableBodyCellClass, 'text-center')}>{mount.servers_count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
};
