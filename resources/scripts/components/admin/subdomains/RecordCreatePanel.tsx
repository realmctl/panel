import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useHistory } from 'react-router-dom';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { createSubdomainRecord, getSubdomainRecordCreateMeta } from '@/api/admin/subdomains';
import RecordFormFields, { RecordFormState } from '@/components/admin/subdomains/RecordFormFields';
import { SettingsFooter, SettingsSection } from '@/components/admin/settings/settingsLayout';
import { adminBasePath } from '@/routers/adminRoutes';

const defaultForm = (domainId: number | null): RecordFormState => ({
    name: '',
    domain_id: domainId,
    egg_ids: [],
    type: 'SRV',
    ttl: '3600',
    protocol: 'tcp',
    priority: '0',
    weight: '5',
    service: '_minecraft',
});

export default () => {
    const history = useHistory();
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data, error, isValidating } = useSWR('admin-subdomain-records-create', getSubdomainRecordCreateMeta);
    const [form, setForm] = useState<RecordFormState | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-subdomains', error });
        } else {
            clearFlashes('admin-subdomains');
        }
    }, [error]);

    useEffect(() => {
        if (data?.domains && !form) {
            const firstDomainId = data.domains[0]?.id ?? null;
            setForm(defaultForm(firstDomainId));
        }
    }, [data, form]);

    const updateField = <K extends keyof RecordFormState>(key: K, value: RecordFormState[K]) => {
        setForm((current) => (current ? { ...current, [key]: value } : current));
    };

    const applyPreset = (values: Partial<RecordFormState>) => {
        setForm((current) => (current ? { ...current, ...values } : current));
    };

    const onToggleEgg = (eggId: number) => {
        setForm((current) => {
            if (!current) return current;

            const eggIds = current.egg_ids.includes(eggId)
                ? current.egg_ids.filter((id) => id !== eggId)
                : [...current.egg_ids, eggId];

            return { ...current, egg_ids: eggIds };
        });
    };

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!form || form.domain_id === null || form.egg_ids.length === 0) return;

        setSaving(true);
        clearFlashes('admin-subdomains');

        createSubdomainRecord({
            ...form,
            domain_id: form.domain_id,
        })
            .then((response: any) => {
                addFlash({
                    key: 'admin-subdomains',
                    type: 'success',
                    title: 'Record created',
                    message: response.message,
                });
                history.push(`${adminBasePath}/subdomains/records/${response.record!.id}`);
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-subdomains', error: submitError });
            })
            .finally(() => setSaving(false));
    };

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    if (!data || !form) {
        return <p className="text-sm text-muted-foreground">Unable to load record form.</p>;
    }

    if (data.domains.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                No domains configured.{' '}
                <Link
                    to={`${adminBasePath}/subdomains/new`}
                    className="text-blue-400 no-underline hover:text-blue-300"
                >
                    Create a domain first
                </Link>
                .
            </p>
        );
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <SettingsSection
                title="New record template"
                description="Define how subdomains are created for a specific domain and egg."
            >
                <RecordFormFields
                    form={form}
                    domains={data.domains}
                    eggs={data.eggs}
                    onChange={updateField}
                    onToggleEgg={onToggleEgg}
                    onApplyPreset={applyPreset}
                />
            </SettingsSection>

            <SettingsFooter>
                <Link to={`${adminBasePath}/subdomains/records`} className="no-underline">
                    <Button type="button" variant="outline">
                        Cancel
                    </Button>
                </Link>
                <Button type="submit" disabled={saving || form.egg_ids.length === 0}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Creating...' : 'Create template'}
                </Button>
            </SettingsFooter>
        </form>
    );
};
