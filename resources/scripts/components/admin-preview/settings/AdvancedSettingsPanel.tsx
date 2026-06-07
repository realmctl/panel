import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { AdvancedSettings, getAdvancedSettings, updateAdvancedSettings } from '@/api/admin/settings';
import { fieldClass, selectClass } from '@/components/admin-preview/settings/fieldClass';

export default () => {
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data, error, isValidating, mutate } = useSWR('admin-settings-advanced', getAdvancedSettings);
    const [form, setForm] = useState<AdvancedSettings | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (data?.settings) {
            setForm(data.settings);
        }
    }, [data]);

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-settings', error });
        } else {
            clearFlashes('admin-settings');
        }
    }, [error]);

    const updateField = <K extends keyof AdvancedSettings>(key: K, value: AdvancedSettings[K]) => {
        setForm((current) => (current ? { ...current, [key]: value } : current));
    };

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!form) return;

        setSaving(true);
        clearFlashes('admin-settings');

        updateAdvancedSettings(form)
            .then((response) => {
                addFlash({
                    key: 'admin-settings',
                    type: 'success',
                    title: 'Settings saved',
                    message: response.message,
                });
                mutate();
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-settings', error: submitError });
            })
            .finally(() => setSaving(false));
    };

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    if (!form) {
        return <p className="text-sm text-muted-foreground">Unable to load advanced settings.</p>;
    }

    const allocationsEnabled = form['pterodactyl:client_features:allocations:enabled'] === 'true';

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <div className="rounded-lg border border-border bg-card">
                <div className="border-b border-border px-5 py-4">
                    <h2 className="text-base font-semibold text-foreground">Automatic allocation creation</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Allow users to automatically create new allocations for their server from the client area.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-3">
                    <div className="space-y-2">
                        <Label htmlFor="allocations-enabled">Status</Label>
                        <select
                            id="allocations-enabled"
                            className={selectClass}
                            value={form['pterodactyl:client_features:allocations:enabled']}
                            onChange={(e) =>
                                updateField(
                                    'pterodactyl:client_features:allocations:enabled',
                                    e.target.value as 'true' | 'false'
                                )
                            }
                        >
                            <option value="false">Disabled</option>
                            <option value="true">Enabled</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="range-start">Starting port</Label>
                        <input
                            id="range-start"
                            type="number"
                            min={1024}
                            max={65535}
                            className={fieldClass}
                            value={form['pterodactyl:client_features:allocations:range_start'] ?? ''}
                            onChange={(e) =>
                                updateField('pterodactyl:client_features:allocations:range_start', e.target.value)
                            }
                            required={allocationsEnabled}
                            disabled={!allocationsEnabled}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="range-end">Ending port</Label>
                        <input
                            id="range-end"
                            type="number"
                            min={1024}
                            max={65535}
                            className={fieldClass}
                            value={form['pterodactyl:client_features:allocations:range_end'] ?? ''}
                            onChange={(e) =>
                                updateField('pterodactyl:client_features:allocations:range_end', e.target.value)
                            }
                            required={allocationsEnabled}
                            disabled={!allocationsEnabled}
                        />
                    </div>
                </div>

                <div className="flex justify-end border-t border-border px-5 py-4">
                    <Button type="submit" disabled={saving}>
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? 'Saving...' : 'Save changes'}
                    </Button>
                </div>
            </div>
        </form>
    );
};
