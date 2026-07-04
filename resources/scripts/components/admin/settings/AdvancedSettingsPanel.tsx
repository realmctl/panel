import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Save, Zap, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { AdvancedSettings, getAdvancedSettings, updateAdvancedSettings } from '@/api/admin/settings';
import { fieldClass, selectClass } from '@/components/admin/settings/fieldClass';
import { SettingRow, SettingsFooter, SettingsSection } from '@/components/admin/settings/settingsLayout';
import AiProviderFields from '@/components/admin/settings/AiProviderFields';
import { useAiProviderForm } from '@/components/admin/settings/useAiProviderForm';

export default () => {
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data, error, isValidating, mutate } = useSWR('admin-settings-advanced', getAdvancedSettings);
    const [form, setForm] = useState<AdvancedSettings | null>(null);
    const [saving, setSaving] = useState(false);

    const ai = useAiProviderForm();

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

        const shouldSaveAi = ai.isConfigured || !!ai.form.api_key;

        setSaving(true);
        clearFlashes('admin-settings');

        Promise.allSettled([updateAdvancedSettings(form), shouldSaveAi ? ai.save() : Promise.resolve()])
            .then(([allocationsResult, aiResult]) => {
                // Always refetch both, regardless of outcome, so the form reflects what's
                // actually persisted instead of silently showing stale values on partial failure.
                mutate();

                const failures = [allocationsResult, aiResult].filter(
                    (result): result is PromiseRejectedResult => result.status === 'rejected'
                );

                if (failures.length === 0) {
                    addFlash({
                        key: 'admin-settings',
                        type: 'success',
                        title: 'Settings saved',
                        message: 'Your changes have been saved.',
                    });
                    return;
                }

                clearAndAddHttpError({ key: 'admin-settings', error: failures[0].reason });
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
                            disabled={!allocationsEnabled}
                            aria-label="Ending port"
                        />
                    </div>
                </SettingRow>
            </SettingsSection>

            <SettingsSection
                title="AI Provider"
                description="Pick one AI provider and set its API key. Future AI-powered panel features will use this."
            >
                <AiProviderFields
                    data={ai.data}
                    form={ai.form}
                    isConfigured={ai.isConfigured}
                    updateField={ai.updateField}
                    testResult={ai.testResult}
                />
            </SettingsSection>

            <SettingsFooter>
                {ai.isConfigured && (
                    <Button type="button" variant="outline" onClick={ai.onRemove} disabled={ai.removing}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        {ai.removing ? 'Removing...' : 'Remove AI provider'}
                    </Button>
                )}
                {ai.isConfigured && (
                    <Button type="button" variant="outline" onClick={ai.onTest} disabled={ai.testing}>
                        <Zap className="mr-2 h-4 w-4" />
                        {ai.testing ? 'Testing...' : 'Test connection'}
                    </Button>
                )}
                <Button type="submit" disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save changes'}
                </Button>
            </SettingsFooter>
        </form>
    );
};
