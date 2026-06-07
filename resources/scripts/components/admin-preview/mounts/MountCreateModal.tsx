import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/elements/dialog';
import useFlash from '@/plugins/useFlash';
import { createMount, MountStorePayload } from '@/api/admin/mounts';
import { fieldClass, textareaClass } from '@/components/admin-preview/settings/fieldClass';
import { SegmentedControl, SettingRow } from '@/components/admin-preview/settings/settingsLayout';

const defaultForm = (): MountStorePayload => ({
    name: '',
    description: '',
    source: '',
    target: '',
    read_only: false,
    user_mountable: false,
});

export default ({
    open,
    onClose,
    onCreated,
}: {
    open: boolean;
    onClose: () => void;
    onCreated: (id: number) => void;
}) => {
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const [form, setForm] = useState(defaultForm);
    const [saving, setSaving] = useState(false);

    const reset = () => setForm(defaultForm());

    const handleClose = () => {
        if (saving) return;
        reset();
        onClose();
    };

    const updateField = <K extends keyof MountStorePayload>(key: K, value: MountStorePayload[K]) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const onSubmit = (event: React.FormEvent) => {
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
                reset();
                onClose();
                onCreated(response.mount!.id);
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-mounts', error: submitError });
            })
            .finally(() => setSaving(false));
    };

    return (
        <Dialog appearance="admin" open={open} onClose={handleClose} title="Create mount">
            <form id="create-mount-form" onSubmit={onSubmit} className="space-y-4">
                <SettingRow label="Name" htmlFor="mount-name" description="A short label to identify this mount.">
                    <input
                        id="mount-name"
                        className={fieldClass}
                        value={form.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        required
                        autoFocus
                    />
                </SettingRow>
                <SettingRow
                    label="Description"
                    htmlFor="mount-description"
                    description="Optional notes about what this mount is used for."
                    wide
                >
                    <textarea
                        id="mount-description"
                        className={textareaClass}
                        rows={3}
                        value={form.description}
                        onChange={(e) => updateField('description', e.target.value)}
                    />
                </SettingRow>
                <SettingRow label="Paths" description="Host source path and container target path.">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <input
                            id="mount-source"
                            className={fieldClass}
                            value={form.source}
                            onChange={(e) => updateField('source', e.target.value)}
                            placeholder="Source"
                            required
                            aria-label="Source path"
                        />
                        <input
                            id="mount-target"
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
            </form>
            <Dialog.Footer>
                <Button type="button" variant="outline" disabled={saving} onClick={handleClose}>
                    Cancel
                </Button>
                <Button type="submit" form="create-mount-form" disabled={saving}>
                    <Plus className="mr-2 h-4 w-4" />
                    {saving ? 'Creating...' : 'Create mount'}
                </Button>
            </Dialog.Footer>
        </Dialog>
    );
};
