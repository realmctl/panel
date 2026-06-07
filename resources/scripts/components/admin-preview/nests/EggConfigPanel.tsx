import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useHistory, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/elements/Spinner';
import { Dialog } from '@/components/elements/dialog';
import useFlash from '@/plugins/useFlash';
import {
    deleteEgg,
    getEgg,
    getEggExportUrl,
    importUpdateEgg,
    updateEgg,
} from '@/api/admin/nests';
import EggTabNav from '@/components/admin-preview/nests/EggTabNav';
import EggFormFields, {
    EggFormState,
    eggToFormState,
    formToEggPayload,
} from '@/components/admin-preview/nests/EggFormFields';
import { fieldClass } from '@/components/admin-preview/settings/fieldClass';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';

export default () => {
    const { id } = useParams<{ id: string }>();
    const eggId = Number(id);
    const history = useHistory();
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data, error, isValidating, mutate } = useSWR(
        Number.isFinite(eggId) ? `admin-egg-${eggId}` : null,
        () => getEgg(eggId)
    );
    const [form, setForm] = useState<EggFormState | null>(null);
    const [saving, setSaving] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (error) clearAndAddHttpError({ key: 'admin-nests', error });
        else clearFlashes('admin-nests');
    }, [error]);

    useEffect(() => {
        if (data?.egg) setForm(eggToFormState(data.egg));
    }, [data]);

    const updateField = <K extends keyof EggFormState>(key: K, value: EggFormState[K]) => {
        setForm((current) => (current ? { ...current, [key]: value } : current));
    };

    const onSave = (event: React.FormEvent) => {
        event.preventDefault();
        if (!form) return;
        setSaving(true);
        updateEgg(eggId, formToEggPayload(form))
            .then((response) => {
                addFlash({ key: 'admin-nests', type: 'success', title: 'Egg updated', message: response.message });
                mutate();
            })
            .catch((e) => clearAndAddHttpError({ key: 'admin-nests', error: e }))
            .finally(() => setSaving(false));
    };

    const onImportUpdate = (event: React.FormEvent) => {
        event.preventDefault();
        if (!importFile) return;
        setImporting(true);
        importUpdateEgg(eggId, importFile)
            .then((response) => {
                addFlash({ key: 'admin-nests', type: 'success', title: 'Egg updated', message: response.message });
                setImportFile(null);
                mutate();
            })
            .catch((e) => clearAndAddHttpError({ key: 'admin-nests', error: e }))
            .finally(() => setImporting(false));
    };

    const onDelete = () => {
        setDeleting(true);
        deleteEgg(eggId)
            .then((response) => {
                addFlash({ key: 'admin-nests', type: 'success', title: 'Egg deleted', message: 'Egg removed.' });
                history.push(`${adminPreviewBasePath}/nests/${response.nest_id}`);
            })
            .catch((e) => {
                clearAndAddHttpError({ key: 'admin-nests', error: e });
                setConfirmDelete(false);
            })
            .finally(() => setDeleting(false));
    };

    if (!data && isValidating) return <Spinner centered />;
    if (!data || !form) return <p className="text-sm text-muted-foreground">Unable to load egg.</p>;

    return (
        <>
            <Dialog.Confirm
                appearance="admin"
                title="Delete egg"
                confirm="Delete"
                open={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirmed={onDelete}
            >
                Delete this egg permanently?
            </Dialog.Confirm>

            <div className="space-y-6">
                <Link
                    to={`${adminPreviewBasePath}/nests/${data.egg.nest_id}`}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground no-underline hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to nest
                </Link>

                <EggTabNav />

                <form onSubmit={onImportUpdate} className="rounded-lg border border-destructive/40 bg-card">
                    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end">
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="egg-import">Replace via JSON import</Label>
                            <input
                                id="egg-import"
                                type="file"
                                accept="application/json"
                                className={fieldClass}
                                onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                            />
                        </div>
                        <Button type="submit" variant="destructive" disabled={importing || !importFile}>
                            Update egg
                        </Button>
                    </div>
                </form>

                <form onSubmit={onSave} className="rounded-lg border border-border bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-foreground">{data.egg.name}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            UUID: <code className="text-xs">{data.egg.uuid}</code> · Author: {data.egg.author}
                        </p>
                    </div>
                    <div className="p-5">
                        <EggFormFields
                            form={form}
                            nestEggs={data.nest_eggs}
                            currentEggId={eggId}
                            onChange={updateField}
                        />
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
                        <div className="flex gap-2">
                            <a href={getEggExportUrl(eggId)} className="no-underline">
                                <Button type="button" variant="outline">
                                    <Download className="mr-2 h-4 w-4" />
                                    Export
                                </Button>
                            </a>
                            <Button type="submit" disabled={saving || deleting}>
                                <Save className="mr-2 h-4 w-4" />
                                Save
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
};
