import React, { useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import useFlash from '@/plugins/useFlash';
import { createNest } from '@/api/admin/nests';
import { fieldClass } from '@/components/admin-preview/settings/fieldClass';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';

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
            .then((response) => {
                addFlash({ key: 'admin-nests', type: 'success', title: 'Nest created', message: response.message });
                history.push(`${adminPreviewBasePath}/nests/${response.nest!.id}`);
            })
            .catch((e) => clearAndAddHttpError({ key: 'admin-nests', error: e }))
            .finally(() => setSaving(false));
    };

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <Link
                to={`${adminPreviewBasePath}/nests`}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground no-underline hover:text-foreground"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to nests
            </Link>
            <div className="rounded-lg border border-border bg-card">
                <div className="border-b border-border px-5 py-4">
                    <h2 className="text-base font-semibold text-foreground">New nest</h2>
                </div>
                <div className="space-y-4 p-5">
                    <div className="space-y-2">
                        <Label htmlFor="nest-name">Name</Label>
                        <input
                            id="nest-name"
                            className={fieldClass}
                            value={form.name}
                            onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="nest-desc">Description</Label>
                        <textarea
                            id="nest-desc"
                            className={fieldClass}
                            rows={5}
                            value={form.description}
                            onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
                        />
                    </div>
                </div>
                <div className="flex justify-end border-t border-border px-5 py-4">
                    <Button type="submit" disabled={saving}>
                        <Save className="mr-2 h-4 w-4" />
                        Save
                    </Button>
                </div>
            </div>
        </form>
    );
};
