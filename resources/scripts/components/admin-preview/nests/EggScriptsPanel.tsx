import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useParams } from 'react-router-dom';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { getEggScripts, updateEggScripts } from '@/api/admin/nests';
import EggTabNav from '@/components/admin-preview/nests/EggTabNav';
import { fieldClass, textareaClass } from '@/components/admin-preview/settings/fieldClass';
import { SettingRow, SettingsFooter, SettingsSection } from '@/components/admin-preview/settings/settingsLayout';
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
        if (error) {
            clearAndAddHttpError({ key: 'admin-nests', error });
        } else {
            clearFlashes('admin-nests');
        }
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
        clearFlashes('admin-nests');

        updateEggScripts(eggId, {
            ...form,
            copy_script_from: form.copy_script_from || null,
        })
            .then((response: any) => {
                addFlash({ key: 'admin-nests', type: 'success', title: 'Script updated', message: response.message });
                mutate();
            })
            .catch((submitError) => clearAndAddHttpError({ key: 'admin-nests', error: submitError }))
            .finally(() => setSaving(false));
    };

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    if (!data) {
        return <p className="text-sm text-muted-foreground">Unable to load install script.</p>;
    }

    return (
        <div className="space-y-4">
            <div className="overflow-hidden rounded-md border border-border bg-card px-5 py-4">
                <h2 className="text-base font-semibold text-foreground">{data.egg.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Install script configuration ·{' '}
                    <Link
                        to={`${adminPreviewBasePath}/nests/${data.egg.nest_id}`}
                        className="text-blue-400 no-underline hover:text-blue-300"
                    >
                        View nest
                    </Link>
                </p>
            </div>

            <EggTabNav />

            {data.egg.copy_from && (
                <p className="rounded-md border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-muted-foreground">
                    Copying install script from{' '}
                    <Link
                        to={`${adminPreviewBasePath}/nests/eggs/${data.egg.copy_from.id}`}
                        className="text-blue-400 no-underline hover:text-blue-300"
                    >
                        {data.egg.copy_from.name}
                    </Link>
                    . Select &quot;None&quot; below to use a custom script.
                </p>
            )}

            <form onSubmit={onSave} className="space-y-4">
                <SettingsSection title="Install script" description="Bash script run when a server is first installed.">
                    <SettingRow
                        label="Script"
                        htmlFor="script-install"
                        description="Shell script executed during installation."
                        wide
                    >
                        <textarea
                            id="script-install"
                            className={textareaClass}
                            rows={12}
                            value={form.script_install}
                            onChange={(e) => setForm((current) => ({ ...current, script_install: e.target.value }))}
                        />
                    </SettingRow>
                    <SettingRow
                        label="Copy script from"
                        htmlFor="script-copy"
                        description="Reuse another egg's install script."
                    >
                        <select
                            id="script-copy"
                            className={fieldClass}
                            value={form.copy_script_from ?? ''}
                            onChange={(e) =>
                                setForm((current) => ({
                                    ...current,
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
                    </SettingRow>
                    <SettingRow
                        label="Script container"
                        htmlFor="script-container"
                        description="Docker image used to run the install script."
                    >
                        <input
                            id="script-container"
                            className={fieldClass}
                            value={form.script_container}
                            onChange={(e) => setForm((current) => ({ ...current, script_container: e.target.value }))}
                        />
                    </SettingRow>
                    <SettingRow
                        label="Script entrypoint"
                        htmlFor="script-entry"
                        description="Entry command for the install container."
                    >
                        <input
                            id="script-entry"
                            className={fieldClass}
                            value={form.script_entry}
                            onChange={(e) => setForm((current) => ({ ...current, script_entry: e.target.value }))}
                        />
                    </SettingRow>
                    <SettingRow label="Dependent eggs" description="Other eggs that copy this install script.">
                        <p className="text-sm text-foreground">
                            {data.rely_on_script.length === 0 ? (
                                'None'
                            ) : (
                                data.rely_on_script.map((rely, index) => (
                                    <span key={rely.id}>
                                        {index > 0 && ', '}
                                        <Link
                                            to={`${adminPreviewBasePath}/nests/eggs/${rely.id}`}
                                            className="text-blue-400 no-underline hover:text-blue-300"
                                        >
                                            {rely.name}
                                        </Link>
                                    </span>
                                ))
                            )}
                        </p>
                    </SettingRow>
                </SettingsSection>

                <SettingsFooter>
                    <Link to={`${adminPreviewBasePath}/nests/eggs/${eggId}`} className="no-underline">
                        <Button type="button" variant="outline" disabled={saving}>
                            Cancel
                        </Button>
                    </Link>
                    <Button type="submit" disabled={saving}>
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? 'Saving...' : 'Save changes'}
                    </Button>
                </SettingsFooter>
            </form>
        </div>
    );
};
