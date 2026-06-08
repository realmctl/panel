import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useHistory, useParams } from 'react-router-dom';
import { Download, Save, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { SettingRow, SettingsFooter, SettingsSection } from '@/components/admin-preview/settings/settingsLayout';
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
        if (error) {
            clearAndAddHttpError({ key: 'admin-nests', error });
        } else {
            clearFlashes('admin-nests');
        }
    }, [error]);

    useEffect(() => {
        if (data?.egg) {
            setForm(eggToFormState(data.egg));
        }
    }, [data]);

    const updateField = <K extends keyof EggFormState>(key: K, value: EggFormState[K]) => {
        setForm((current) => (current ? { ...current, [key]: value } : current));
    };

    const onSave = (event: React.FormEvent) => {
        event.preventDefault();
        if (!form) return;

        setSaving(true);
        clearFlashes('admin-nests');

        updateEgg(eggId, formToEggPayload(form))
            .then((response: any) => {
                addFlash({ key: 'admin-nests', type: 'success', title: 'Egg updated', message: response.message });
                mutate();
            })
            .catch((submitError) => clearAndAddHttpError({ key: 'admin-nests', error: submitError }))
            .finally(() => setSaving(false));
    };

    const onImportUpdate = (event: React.FormEvent) => {
        event.preventDefault();
        if (!importFile) return;

        setImporting(true);
        clearFlashes('admin-nests');

        importUpdateEgg(eggId, importFile)
            .then((response: any) => {
                addFlash({ key: 'admin-nests', type: 'success', title: 'Egg updated', message: response.message });
                setImportFile(null);
                mutate();
            })
            .catch((submitError) => clearAndAddHttpError({ key: 'admin-nests', error: submitError }))
            .finally(() => setImporting(false));
    };

    const onDelete = () => {
        setDeleting(true);
        deleteEgg(eggId)
            .then((response: any) => {
                addFlash({ key: 'admin-nests', type: 'success', title: 'Egg deleted', message: 'Egg removed.' });
                history.push(`${adminPreviewBasePath}/nests/${response.nest_id}`);
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

    if (!data || !form) {
        return <p className="text-sm text-muted-foreground">Unable to load egg.</p>;
    }

    const { egg } = data;

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

            <div className="mb-4 overflow-hidden rounded-md border border-border bg-card px-5 py-4">
                <h2 className="text-base font-semibold text-foreground">{egg.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    {egg.author} · <code>#{egg.id}</code>
                    {' · '}
                    <Link
                        to={`${adminPreviewBasePath}/nests/${egg.nest_id}`}
                        className="text-blue-400 no-underline hover:text-blue-300"
                    >
                        View nest
                    </Link>
                </p>
            </div>

            <EggTabNav />

            <form onSubmit={onImportUpdate} className="mb-4">
                <SettingsSection
                    title="Import"
                    description="Replace this egg entirely from a JSON export file."
                >
                    <SettingRow label="Egg file" htmlFor="egg-import" description="Overwrites all egg configuration.">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <input
                                id="egg-import"
                                type="file"
                                accept="application/json"
                                className={fieldClass}
                                onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                            />
                            <Button
                                type="submit"
                                variant="outline"
                                className="shrink-0 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                disabled={importing || !importFile}
                            >
                                <Upload className="mr-2 h-4 w-4" />
                                {importing ? 'Importing...' : 'Replace from file'}
                            </Button>
                        </div>
                    </SettingRow>
                </SettingsSection>
            </form>

            <form onSubmit={onSave} className="space-y-4">
                <EggFormFields form={form} nestEggs={data.nest_eggs} currentEggId={eggId} onChange={updateField} />

                <SettingsFooter>
                    <Button
                        type="button"
                        variant="outline"
                        className="mr-auto border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={deleting || saving}
                        onClick={() => setConfirmDelete(true)}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete egg
                    </Button>
                    <Link to={`${adminPreviewBasePath}/nests/${egg.nest_id}`} className="no-underline">
                        <Button type="button" variant="outline" disabled={saving || deleting}>
                            Cancel
                        </Button>
                    </Link>
                    <a href={getEggExportUrl(eggId)} className="no-underline">
                        <Button type="button" variant="outline" disabled={saving || deleting}>
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                    </a>
                    <Button type="submit" disabled={saving || deleting}>
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? 'Saving...' : 'Save changes'}
                    </Button>
                </SettingsFooter>
            </form>
        </>
    );
};
