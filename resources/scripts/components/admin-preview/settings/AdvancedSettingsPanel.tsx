import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { AdvancedSettings, getAdvancedSettings, updateAdvancedSettings } from '@/api/admin/settings';
import { fieldClass, selectClass } from '@/components/admin-preview/settings/fieldClass';
import { SettingRow, SettingsFooter, SettingsSection } from '@/components/admin-preview/settings/settingsLayout';

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

    const allocationsEnabled = form['realm:client_features:allocations:enabled'] === 'true';

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <SettingsSection
                title="Automatic allocations"
                description="Let users create new server allocations from the client area."
            >
                <SettingRow
                    label="Status"
                    htmlFor="allocations-enabled"
                    description="When enabled, users can add allocations within the port range below."
                >
                    <select
                        id="allocations-enabled"
                        className={selectClass}
                        value={form['realm:client_features:allocations:enabled']}
                        onChange={(e) =>
                            updateField(
                                'realm:client_features:allocations:enabled',
                                e.target.value as 'true' | 'false'
                            )
                        }
                    >
                        <option value="false">Disabled</option>
                        <option value="true">Enabled</option>
                    </select>
                </SettingRow>

                <SettingRow
                    label="Port range"
                    description="Ports users may assign when creating allocations (1024–65535)."
                >
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            id="range-start"
                            type="number"
                            min={1024}
                            max={65535}
                            className={fieldClass}
                            value={form['realm:client_features:allocations:range_start'] ?? ''}
                            onChange={(e) =>
                                updateField('realm:client_features:allocations:range_start', e.target.value)
                            }
                            placeholder="Start"
                            required={allocationsEnabled}
                            disabled={!allocationsEnabled}
                            aria-label="Starting port"
                        />
                        <input
                            id="range-end"
                            type="number"
                            min={1024}
                            max={65535}
                            className={fieldClass}
                            value={form['realm:client_features:allocations:range_end'] ?? ''}
                            onChange={(e) =>
                                updateField('realm:client_features:allocations:range_end', e.target.value)
                            }
                            placeholder="End"
                            required={allocationsEnabled}
                            disabled={!allocationsEnabled}
                            aria-label="Ending port"
                        />
                    </div>
                </SettingRow>
            </SettingsSection>

            <SettingsFooter>
                <Button type="submit" disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save changes'}
                </Button>
            </SettingsFooter>
        </form>
    );
};
