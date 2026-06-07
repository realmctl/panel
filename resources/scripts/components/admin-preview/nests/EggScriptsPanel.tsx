import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { getEggScripts, updateEggScripts } from '@/api/admin/nests';
import EggTabNav from '@/components/admin-preview/nests/EggTabNav';
import { fieldClass } from '@/components/admin-preview/settings/fieldClass';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';

export default () => {
    const { id } = useParams<{ id: string }>();
    const eggId = Number(id);
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data, error, isValidating, mutate } = useSWR(
        Number.isFinite(eggId) ? `admin-egg-scripts-${eggId}` : null,
        () => getEggScripts(eggId)
    );
    const [form, setForm] = useState({
        script_install: '',
        script_container: '',
        script_entry: '',
        copy_script_from: null as number | null,
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (error) clearAndAddHttpError({ key: 'admin-nests', error });
        else clearFlashes('admin-nests');
    }, [error]);

    useEffect(() => {
        if (data?.egg) {
            setForm({
                script_install: data.egg.script_install ?? '',
                script_container: data.egg.script_container ?? '',
                script_entry: data.egg.script_entry ?? '',
                copy_script_from: data.egg.copy_script_from,
            });
        }
    }, [data]);

    const onSave = (event: React.FormEvent) => {
        event.preventDefault();
        setSaving(true);
        updateEggScripts(eggId, {
            ...form,
            copy_script_from: form.copy_script_from || null,
        })
            .then((response) => {
                addFlash({ key: 'admin-nests', type: 'success', title: 'Script updated', message: response.message });
                mutate();
            })
            .catch((e) => clearAndAddHttpError({ key: 'admin-nests', error: e }))
            .finally(() => setSaving(false));
    };

    if (!data && isValidating) return <Spinner centered />;
    if (!data) return <p className="text-sm text-muted-foreground">Unable to load install script.</p>;

    return (
        <div className="space-y-6">
            <Link
                to={`${adminPreviewBasePath}/nests/${data.egg.nest_id}`}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground no-underline hover:text-foreground"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to nest
            </Link>
            <EggTabNav />

            {data.egg.copy_from && (
                <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-muted-foreground">
                    Copying install script from{' '}
                    <Link
                        to={`${adminPreviewBasePath}/nests/eggs/${data.egg.copy_from.id}`}
                        className="text-primary no-underline hover:underline"
                    >
                        {data.egg.copy_from.name}
                    </Link>
                    . Select &quot;None&quot; below to use a custom script.
                </div>
            )}

            <form onSubmit={onSave} className="rounded-lg border border-border bg-card">
                <div className="border-b border-border px-5 py-4">
                    <h2 className="text-base font-semibold text-foreground">Install script</h2>
                </div>
                <div className="space-y-4 p-5">
                    <div className="space-y-2">
                        <Label htmlFor="script-install">Script</Label>
                        <textarea
                            id="script-install"
                            className={fieldClass}
                            rows={12}
                            value={form.script_install}
                            onChange={(e) => setForm((c) => ({ ...c, script_install: e.target.value }))}
                        />
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="script-copy">Copy script from</Label>
                            <select
                                id="script-copy"
                                className={fieldClass}
                                value={form.copy_script_from ?? ''}
                                onChange={(e) =>
                                    setForm((c) => ({
                                        ...c,
                                        copy_script_from: e.target.value ? Number(e.target.value) : null,
                                    }))
                                }
                            >
                                <option value="">None</option>
                                {data.copy_from_options.map((opt) => (
                                    <option key={opt.id} value={opt.id}>
                                        {opt.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="script-container">Script container</Label>
                            <input
                                id="script-container"
                                className={fieldClass}
                                value={form.script_container}
                                onChange={(e) => setForm((c) => ({ ...c, script_container: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="script-entry">Script entrypoint</Label>
                            <input
                                id="script-entry"
                                className={fieldClass}
                                value={form.script_entry}
                                onChange={(e) => setForm((c) => ({ ...c, script_entry: e.target.value }))}
                            />
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Eggs relying on this script:{' '}
                        {data.rely_on_script.length === 0 ? (
                            'none'
                        ) : (
                            data.rely_on_script.map((rely, index) => (
                                <span key={rely.id}>
                                    {index > 0 && ', '}
                                    <Link
                                        to={`${adminPreviewBasePath}/nests/eggs/${rely.id}`}
                                        className="text-primary no-underline hover:underline"
                                    >
                                        {rely.name}
                                    </Link>
                                </span>
                            ))
                        )}
                    </p>
                </div>
                <div className="flex justify-end border-t border-border px-5 py-4">
                    <Button type="submit" disabled={saving}>
                        <Save className="mr-2 h-4 w-4" />
                        Save
                    </Button>
                </div>
            </form>
        </div>
    );
};
