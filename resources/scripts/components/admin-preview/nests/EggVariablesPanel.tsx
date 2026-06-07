import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useParams } from 'react-router-dom';
import { Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import { Dialog } from '@/components/elements/dialog';
import useFlash from '@/plugins/useFlash';
import {
    createEggVariable,
    deleteEggVariable,
    EggVariable,
    getEggVariables,
    updateEggVariable,
} from '@/api/admin/nests';
import EggTabNav from '@/components/admin-preview/nests/EggTabNav';
import { fieldClass, textareaClass } from '@/components/admin-preview/settings/fieldClass';
import { SettingRow, SettingsFooter } from '@/components/admin-preview/settings/settingsLayout';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';

const defaultVariable = () => ({
    name: '',
    description: '',
    env_variable: '',
    default_value: '',
    rules: 'required|string|max:20',
    user_viewable: false,
    user_editable: false,
});

const VariableCard = ({
    eggId,
    variable,
    onMutate,
}: {
    eggId: number;
    variable: EggVariable;
    onMutate: () => void;
}) => {
    const { clearAndAddHttpError, addFlash } = useFlash();
    const [form, setForm] = useState({
        name: variable.name,
        description: variable.description ?? '',
        env_variable: variable.env_variable,
        default_value: variable.default_value,
        rules: variable.rules,
        user_viewable: variable.user_viewable,
        user_editable: variable.user_editable,
    });
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const onSave = (event: React.FormEvent) => {
        event.preventDefault();
        setSaving(true);

        updateEggVariable(eggId, variable.id, {
            ...form,
            options: [
                ...(form.user_viewable ? ['user_viewable'] : []),
                ...(form.user_editable ? ['user_editable'] : []),
            ],
        })
            .then((response) => {
                addFlash({ key: 'admin-nests', type: 'success', title: 'Variable updated', message: response.message });
                onMutate();
            })
            .catch((submitError) => clearAndAddHttpError({ key: 'admin-nests', error: submitError }))
            .finally(() => setSaving(false));
    };

    const onDelete = () => {
        deleteEggVariable(eggId, variable.id)
            .then(() => onMutate())
            .catch((submitError) => clearAndAddHttpError({ key: 'admin-nests', error: submitError }))
            .finally(() => setConfirmDelete(false));
    };

    return (
        <>
            <Dialog.Confirm
                appearance="admin"
                title="Delete variable"
                confirm="Delete"
                open={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirmed={onDelete}
            >
                Delete variable &quot;{variable.name}&quot;?
            </Dialog.Confirm>

            <form onSubmit={onSave} className="overflow-hidden rounded-md border border-border bg-card">
                <div className="border-b border-border px-5 py-4">
                    <h3 className="text-base font-semibold text-foreground">{variable.name}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        <code>{`{{${form.env_variable}}}`}</code> in startup command
                    </p>
                </div>
                <div className="divide-y divide-border">
                    <SettingRow label="Name" htmlFor={`var-name-${variable.id}`} description="Display label.">
                        <input
                            id={`var-name-${variable.id}`}
                            className={fieldClass}
                            value={form.name}
                            onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                            required
                        />
                    </SettingRow>
                    <SettingRow
                        label="Description"
                        htmlFor={`var-desc-${variable.id}`}
                        description="Help text shown to users."
                    >
                        <textarea
                            id={`var-desc-${variable.id}`}
                            className={textareaClass}
                            rows={2}
                            value={form.description}
                            onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
                        />
                    </SettingRow>
                    <SettingRow
                        label="Environment variable"
                        htmlFor={`var-env-${variable.id}`}
                        description="Variable name injected into the container."
                    >
                        <input
                            id={`var-env-${variable.id}`}
                            className={fieldClass}
                            value={form.env_variable}
                            onChange={(e) => setForm((current) => ({ ...current, env_variable: e.target.value }))}
                            required
                        />
                    </SettingRow>
                    <SettingRow
                        label="Default value"
                        htmlFor={`var-default-${variable.id}`}
                        description="Value used when not overridden."
                    >
                        <input
                            id={`var-default-${variable.id}`}
                            className={fieldClass}
                            value={form.default_value}
                            onChange={(e) => setForm((current) => ({ ...current, default_value: e.target.value }))}
                        />
                    </SettingRow>
                    <SettingRow label="User access" description="What customers can do with this variable.">
                        <div className="flex flex-wrap gap-4">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    className="rounded border-border"
                                    checked={form.user_viewable}
                                    onChange={(e) =>
                                        setForm((current) => ({ ...current, user_viewable: e.target.checked }))
                                    }
                                />
                                Users can view
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    className="rounded border-border"
                                    checked={form.user_editable}
                                    onChange={(e) =>
                                        setForm((current) => ({ ...current, user_editable: e.target.checked }))
                                    }
                                />
                                Users can edit
                            </label>
                        </div>
                    </SettingRow>
                    <SettingRow
                        label="Validation rules"
                        htmlFor={`var-rules-${variable.id}`}
                        description="Laravel validation rules for user input."
                    >
                        <input
                            id={`var-rules-${variable.id}`}
                            className={fieldClass}
                            value={form.rules}
                            onChange={(e) => setForm((current) => ({ ...current, rules: e.target.value }))}
                            required
                        />
                    </SettingRow>
                </div>
                <SettingsFooter>
                    <Button
                        type="button"
                        variant="outline"
                        className="mr-auto border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setConfirmDelete(true)}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                    <Button type="submit" disabled={saving}>
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </SettingsFooter>
            </form>
        </>
    );
};

export default () => {
    const { id } = useParams<{ id: string }>();
    const eggId = Number(id);
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data, error, isValidating, mutate } = useSWR(
        Number.isFinite(eggId) ? `admin-egg-vars-${eggId}` : null,
        () => getEggVariables(eggId)
    );
    const [createOpen, setCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState(defaultVariable());
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-nests', error });
        } else {
            clearFlashes('admin-nests');
        }
    }, [error]);

    const onCreate = (event: React.FormEvent) => {
        event.preventDefault();
        setCreating(true);
        clearFlashes('admin-nests');

        createEggVariable(eggId, {
            ...createForm,
            options: [
                ...(createForm.user_viewable ? ['user_viewable'] : []),
                ...(createForm.user_editable ? ['user_editable'] : []),
            ],
        })
            .then((response) => {
                addFlash({ key: 'admin-nests', type: 'success', title: 'Variable created', message: response.message });
                setCreateOpen(false);
                setCreateForm(defaultVariable());
                mutate();
            })
            .catch((submitError) => clearAndAddHttpError({ key: 'admin-nests', error: submitError }))
            .finally(() => setCreating(false));
    };

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    if (!data) {
        return <p className="text-sm text-muted-foreground">Unable to load variables.</p>;
    }

    return (
        <>
            <Dialog appearance="admin" open={createOpen} onClose={() => setCreateOpen(false)} title="Create variable">
                <form id="create-variable-form" onSubmit={onCreate} className="space-y-4">
                    <SettingRow label="Name" htmlFor="create-var-name" description="Display label.">
                        <input
                            id="create-var-name"
                            className={fieldClass}
                            value={createForm.name}
                            onChange={(e) => setCreateForm((current) => ({ ...current, name: e.target.value }))}
                            required
                        />
                    </SettingRow>
                    <SettingRow
                        label="Environment variable"
                        htmlFor="create-var-env"
                        description="Variable name injected into the container."
                    >
                        <input
                            id="create-var-env"
                            className={fieldClass}
                            value={createForm.env_variable}
                            onChange={(e) =>
                                setCreateForm((current) => ({ ...current, env_variable: e.target.value }))
                            }
                            required
                        />
                    </SettingRow>
                    <SettingRow
                        label="Validation rules"
                        htmlFor="create-var-rules"
                        description="Laravel validation rules."
                    >
                        <input
                            id="create-var-rules"
                            className={fieldClass}
                            value={createForm.rules}
                            onChange={(e) => setCreateForm((current) => ({ ...current, rules: e.target.value }))}
                            required
                        />
                    </SettingRow>
                </form>
                <Dialog.Footer>
                    <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" form="create-variable-form" disabled={creating}>
                        {creating ? 'Creating...' : 'Create variable'}
                    </Button>
                </Dialog.Footer>
            </Dialog>

            <div className="space-y-4">
                <div className="overflow-hidden rounded-md border border-border bg-card px-5 py-4">
                    <h2 className="text-base font-semibold text-foreground">{data.egg.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Environment variables ·{' '}
                        <Link
                            to={`${adminPreviewBasePath}/nests/${data.egg.nest_id}`}
                            className="text-blue-400 no-underline hover:text-blue-300"
                        >
                            View nest
                        </Link>
                    </p>
                </div>

                <EggTabNav />

                <div className="overflow-hidden rounded-md border border-border bg-card">
                    <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-foreground">Variables</h2>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                Customer-configurable environment values.
                            </p>
                        </div>
                        <Button onClick={() => setCreateOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create variable
                        </Button>
                    </div>
                    {data.variables.length === 0 ? (
                        <p className="px-5 py-8 text-sm text-muted-foreground">No variables defined yet.</p>
                    ) : (
                        <div className="space-y-4 p-4">
                            {data.variables.map((variable) => (
                                <VariableCard key={variable.id} eggId={eggId} variable={variable} onMutate={mutate} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
