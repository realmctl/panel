import React from 'react';
import { AiProviderCurrentResponse } from '@/api/admin/aiProviders';
import { fieldClass, selectClass } from '@/components/admin/settings/fieldClass';
import { SettingRow } from '@/components/admin/settings/settingsLayout';
import { AiProviderFormState } from '@/components/admin/settings/useAiProviderForm';

interface Props {
    data: AiProviderCurrentResponse | undefined;
    form: AiProviderFormState;
    isConfigured: boolean;
    updateField: <K extends keyof AiProviderFormState>(key: K, value: AiProviderFormState[K]) => void;
    testResult: { success: boolean; message: string } | null;
}

export default ({ data, form, isConfigured, updateField, testResult }: Props) => {
    const config = data?.providers?.[form.type];

    return (
        <>
            <SettingRow label="Provider" htmlFor="ai-type" description="Which AI service to use.">
                <select
                    id="ai-type"
                    className={selectClass}
                    value={form.type}
                    onChange={(e) => updateField('type', e.target.value)}
                >
                    {Object.keys(data?.providers ?? {}).map((key) => (
                        <option key={key} value={key}>
                            {data!.providers[key].title}
                        </option>
                    ))}
                </select>
            </SettingRow>

            <SettingRow
                label="API key"
                htmlFor="ai-key"
                description={isConfigured ? 'Leave blank to keep the currently saved key.' : 'Stored encrypted, never shown again.'}
            >
                <input
                    id="ai-key"
                    type="password"
                    autoComplete="off"
                    className={fieldClass}
                    value={form.api_key}
                    onChange={(e) => updateField('api_key', e.target.value)}
                    placeholder={isConfigured ? '••••••••••••' : ''}
                />
            </SettingRow>

            {config?.custom_base_url && (
                <SettingRow
                    label="Base URL"
                    htmlFor="ai-base-url"
                    description="Full API base URL for this OpenAI-compatible endpoint, e.g. https://api.example.com/v1."
                >
                    <input
                        id="ai-base-url"
                        className={fieldClass}
                        value={form.base_url}
                        onChange={(e) => updateField('base_url', e.target.value)}
                        placeholder="https://api.example.com/v1"
                    />
                </SettingRow>
            )}

            <SettingRow
                label="Model"
                htmlFor="ai-model"
                description={`Leave blank to use the default (${config?.default_model || 'provider default'}).`}
            >
                <input
                    id="ai-model"
                    className={fieldClass}
                    value={form.model}
                    onChange={(e) => updateField('model', e.target.value)}
                    placeholder={config?.default_model}
                />
            </SettingRow>

            {testResult && (
                <div
                    className={`mx-5 mb-4 rounded-md border px-4 py-3 text-sm ${
                        testResult.success
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                            : 'border-destructive/30 bg-destructive/10 text-destructive'
                    }`}
                >
                    {testResult.message}
                </div>
            )}
        </>
    );
};
