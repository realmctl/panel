import React, { useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useFlash from '@/plugins/useFlash';
import { createNest } from '@/api/admin/nests';
import { fieldClass, textareaClass } from '@/components/admin/settings/fieldClass';
import { SettingRow, SettingsFooter, SettingsSection } from '@/components/admin/settings/settingsLayout';
import { adminBasePath } from '@/routers/adminRoutes';

export default () => {
    const history = useHistory();
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const [form, setForm] = useState({ name: '', description: '' });
    const [saving, setSaving] = useState(false);

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        setSaving(true);
        clearFlashes('admin-nests');

        createNest(form)
            .then((response: any) => {
                addFlash({ key: 'admin-nests', type: 'success', title: 'Nest created', message: response.message });
                history.push(`${adminBasePath}/nests/${response.nest!.id}`);
            })
            .catch((submitError) => clearAndAddHttpError({ key: 'admin-nests', error: submitError }))
            .finally(() => setSaving(false));
    };

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <SettingsSection
                title="New nest"
                description="A category for grouping related eggs, e.g. Minecraft or Source Engine."
            >
                <SettingRow label="Name" htmlFor="nest-name" description="Display name for this nest.">
                    <input
                        id="nest-name"
                        className={fieldClass}
                        value={form.name}
                        onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                        required
                    />
                </SettingRow>
                <SettingRow
                    label="Description"
                    htmlFor="nest-desc"
                    description="Optional summary shown in the admin area."
                    wide
                >
                    <textarea
                        id="nest-desc"
                        className={textareaClass}
                        rows={5}
                        value={form.description}
                        onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
                    />
                </SettingRow>
            </SettingsSection>

            <SettingsFooter>
                <Link to={`${adminBasePath}/nests`} className="no-underline">
                    <Button type="button" variant="outline">
                        Cancel
                    </Button>
                </Link>
                <Button type="submit" disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Creating...' : 'Create nest'}
                </Button>
            </SettingsFooter>
        </form>
    );
};
