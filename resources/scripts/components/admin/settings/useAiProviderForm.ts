import { useEffect, useState } from 'react';
import useSWR from 'swr';
import useFlash from '@/plugins/useFlash';
import { getCurrentAiProvider, saveAiProvider, removeAiProvider, testAiProvider } from '@/api/admin/aiProviders';

export interface AiProviderFormState {
    type: string;
    api_key: string;
    base_url: string;
    model: string;
}

const defaultForm = (): AiProviderFormState => ({ type: 'anthropic', api_key: '', base_url: '', model: '' });

export const useAiProviderForm = () => {
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data, error, isValidating, mutate } = useSWR('admin-ai-provider', getCurrentAiProvider);
    const [form, setForm] = useState<AiProviderFormState>(defaultForm);
    const [testing, setTesting] = useState(false);
    const [removing, setRemoving] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    const isConfigured = !!data?.provider;

    useEffect(() => {
        if (data?.provider) {
            setForm({
                type: data.provider.type,
                api_key: '',
                base_url: data.provider.base_url ?? '',
                model: data.provider.model ?? '',
            });
        }
    }, [data]);

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-settings', error });
        }
    }, [error]);

    const updateField = <K extends keyof AiProviderFormState>(key: K, value: AiProviderFormState[K]) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const save = () => saveAiProvider({ ...form, api_key: form.api_key || undefined }).then(() => mutate());

    const onTest = () => {
        setTesting(true);
        setTestResult(null);

        testAiProvider()
            .then((response) => {
                setTestResult({
                    success: response.success,
                    message: response.success ? `Connected — reply: "${response.reply}"` : response.error || 'Test failed.',
                });
            })
            .catch(() => setTestResult({ success: false, message: 'Test request failed.' }))
            .finally(() => setTesting(false));
    };

    const onRemove = () => {
        setRemoving(true);
        clearFlashes('admin-settings');

        removeAiProvider()
            .then(() => {
                addFlash({
                    key: 'admin-settings',
                    type: 'success',
                    title: 'AI provider removed',
                    message: 'The configured AI provider was removed.',
                });
                setForm(defaultForm());
                setTestResult(null);
                mutate();
            })
            .catch((removeError: any) => {
                clearAndAddHttpError({ key: 'admin-settings', error: removeError });
            })
            .finally(() => setRemoving(false));
    };

    return {
        data,
        isValidating,
        form,
        updateField,
        isConfigured,
        save,
        testing,
        onTest,
        testResult,
        removing,
        onRemove,
    };
};
