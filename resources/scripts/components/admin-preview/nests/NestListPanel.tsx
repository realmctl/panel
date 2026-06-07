import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useHistory } from 'react-router-dom';
import { AlertTriangle, Egg, Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/elements/Spinner';
import { Dialog } from '@/components/elements/dialog';
import useFlash from '@/plugins/useFlash';
import { getNests, importEgg } from '@/api/admin/nests';
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
    const history = useHistory();
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data, error, isValidating, mutate } = useSWR('admin-nests', getNests);
    const [importOpen, setImportOpen] = useState(false);
    const [importNestId, setImportNestId] = useState<number | null>(null);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-nests', error });
        } else {
            clearFlashes('admin-nests');
        }
    }, [error]);

    useEffect(() => {
        if (data?.nests[0] && importNestId === null) {
            setImportNestId(data.nests[0].id);
        }
    }, [data, importNestId]);

    const onImport = (event: React.FormEvent) => {
        event.preventDefault();
        if (!importFile || importNestId === null) return;

        setImporting(true);
        importEgg(importFile, importNestId)
            .then((response) => {
                addFlash({ key: 'admin-nests', type: 'success', title: 'Egg imported', message: response.message });
                setImportOpen(false);
                setImportFile(null);
                mutate();
                history.push(`${adminPreviewBasePath}/nests/eggs/${response.egg!.id}`);
            })
            .catch((e) => clearAndAddHttpError({ key: 'admin-nests', error: e }))
            .finally(() => setImporting(false));
    };

    if (!data && isValidating) return <Spinner centered />;

    const nests = data?.nests ?? [];

    return (
        <>
            <Dialog appearance="admin" open={importOpen} onClose={() => setImportOpen(false)} title="Import egg">
                <form onSubmit={onImport} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="import-file">Egg file</Label>
                        <input
                            id="import-file"
                            type="file"
                            accept="application/json"
                            className={fieldClass}
                            onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="import-nest">Associated nest</Label>
                        <select
                            id="import-nest"
                            className={fieldClass}
                            value={importNestId ?? ''}
                            onChange={(e) => setImportNestId(Number(e.target.value))}
                        >
                            {nests.map((nest) => (
                                <option key={nest.id} value={nest.id}>
                                    {nest.name} &lt;{nest.author}&gt;
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setImportOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={importing || !importFile}>
                            Import
                        </Button>
                    </div>
                </form>
            </Dialog>

            <div className="mb-6 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-muted-foreground">
                <div className="flex gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
                    <p>
                        Eggs allow extreme flexibility but modifying them incorrectly can break servers. Avoid editing
                        default eggs from <code>support@realmctl.com</code> unless you know what you are doing.
                    </p>
                </div>
            </div>

            <div className="rounded-lg border border-border bg-card">
                <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-foreground">Configured nests</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => setImportOpen(true)} disabled={nests.length === 0}>
                            <Upload className="mr-2 h-4 w-4" />
                            Import egg
                        </Button>
                        <Link to={`${adminPreviewBasePath}/nests/new`} className="no-underline">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Create new
                            </Button>
                        </Link>
                    </div>
                </div>

                {nests.length === 0 ? (
                    <div className="flex flex-col items-center px-5 py-12 text-center">
                        <Egg className="mb-4 h-10 w-10 text-muted-foreground" />
                        <p className="text-base font-medium text-foreground">No nests</p>
                        <Link to={`${adminPreviewBasePath}/nests/new`} className="mt-5 no-underline">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Create new
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className={tableWrapClass}>
                        <table className={tableClass}>
                            <thead>
                                <tr className={tableHeadRowClass}>
                                    <th className={tableHeadCellClass}>ID</th>
                                    <th className={tableHeadCellClass}>Name</th>
                                    <th className={tableHeadCellClass}>Description</th>
                                    <th className={cn(tableHeadCellClass, 'text-center')}>Eggs</th>
                                    <th className={cn(tableHeadCellClass, 'text-center')}>Servers</th>
                                </tr>
                            </thead>
                            <tbody>
                                {nests.map((nest) => (
                                    <tr key={nest.id} className={tableBodyRowClass}>
                                        <td className={tableBodyCellClass}>
                                            <code className="text-xs text-muted-foreground">{nest.id}</code>
                                        </td>
                                        <td className={tableBodyCellClass}>
                                            <Link
                                                to={`${adminPreviewBasePath}/nests/${nest.id}`}
                                                className="font-medium text-primary no-underline hover:underline"
                                                title={nest.author}
                                            >
                                                {nest.name}
                                            </Link>
                                        </td>
                                        <td className={cn(tableBodyCellClass, 'max-w-md text-muted-foreground')}>
                                            {nest.description || '—'}
                                        </td>
                                        <td className={cn(tableBodyCellClass, 'text-center')}>{nest.eggs_count}</td>
                                        <td className={cn(tableBodyCellClass, 'text-center')}>{nest.servers_count}</td>
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
