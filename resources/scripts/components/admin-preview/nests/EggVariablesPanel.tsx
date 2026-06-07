import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import { fieldClass } from '@/components/admin-preview/settings/fieldClass';
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
            .catch((e) => clearAndAddHttpError({ key: 'admin-nests', error: e }))
            .finally(() => setSaving(false));
    };

    const onDelete = () => {
        deleteEggVariable(eggId, variable.id)
            .then(() => onMutate())
            .catch((e) => clearAndAddHttpError({ key: 'admin-nests', error: e }))
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
            <form onSubmit={onSave} className="rounded-lg border border-border bg-card">
                <div className="border-b border-border px-5 py-4">
                    <h3 className="text-base font-semibold text-foreground">{variable.name}</h3>
                </div>
                <div className="space-y-4 p-5">
                    <div className="space-y-2">
                        <Label>Name</Label>
                        <input
                            className={fieldClass}
                            value={form.name}
                            onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Description</Label>
                        <textarea
                            className={fieldClass}
                            rows={2}
                            value={form.description}
                            onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Environment variable</Label>
                            <input
                                className={fieldClass}
                                value={form.env_variable}
                                onChange={(e) => setForm((c) => ({ ...c, env_variable: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Default value</Label>
                            <input
                                className={fieldClass}
                                value={form.default_value}
                                onChange={(e) => setForm((c) => ({ ...c, default_value: e.target.value }))}
                            />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Use <code>{`{{${form.env_variable}}}`}</code> in the startup command.
                    </p>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={form.user_viewable}
                                onChange={(e) => setForm((c) => ({ ...c, user_viewable: e.target.checked }))}
                            />
                            Users can view
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={form.user_editable}
                                onChange={(e) => setForm((c) => ({ ...c, user_editable: e.target.checked }))}
                            />
                            Users can edit
                        </label>
                    </div>
                    <div className="space-y-2">
                        <Label>Input rules</Label>
                        <input
                            className={fieldClass}
                            value={form.rules}
                            onChange={(e) => setForm((c) => ({ ...c, rules: e.target.value }))}
                            required
                        />
                    </div>
                </div>
                <div className="flex justify-between border-t border-border px-5 py-4">
                    <Button type="button" variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                    <Button type="submit" size="sm" disabled={saving}>
                        <Save className="mr-2 h-4 w-4" />
                        Save
                    </Button>
                </div>
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
        if (error) clearAndAddHttpError({ key: 'admin-nests', error });
        else clearFlashes('admin-nests');
    }, [error]);

    const onCreate = (event: React.FormEvent) => {
        event.preventDefault();
        setCreating(true);
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
            .catch((e) => clearAndAddHttpError({ key: 'admin-nests', error: e }))
            .finally(() => setCreating(false));
    };

    if (!data && isValidating) return <Spinner centered />;
    if (!data) return <p className="text-sm text-muted-foreground">Unable to load variables.</p>;

    return (
        <>
            <Dialog appearance="admin" open={createOpen} onClose={() => setCreateOpen(false)} title="Create variable">
                <form onSubmit={onCreate} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Name</Label>
                        <input
                            className={fieldClass}
                            value={createForm.name}
                            onChange={(e) => setCreateForm((c) => ({ ...c, name: e.target.value }))}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Environment variable</Label>
                        <input
                            className={fieldClass}
                            value={createForm.env_variable}
                            onChange={(e) => setCreateForm((c) => ({ ...c, env_variable: e.target.value }))}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Rules</Label>
                        <input
                            className={fieldClass}
                            value={createForm.rules}
                            onChange={(e) => setCreateForm((c) => ({ ...c, rules: e.target.value }))}
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={creating}>
                            Create
                        </Button>
                    </div>
                </form>
            </Dialog>

            <div className="space-y-6">
                <Link
                    to={`${adminPreviewBasePath}/nests/${data.egg.nest_id}`}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground no-underline hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to nest
                </Link>
                <EggTabNav />
                <div className="flex justify-end">
                    <Button onClick={() => setCreateOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create variable
                    </Button>
                </div>
                {data.variables.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground">No variables defined.</p>
                ) : (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {data.variables.map((variable) => (
                            <VariableCard key={variable.id} eggId={eggId} variable={variable} onMutate={mutate} />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};
