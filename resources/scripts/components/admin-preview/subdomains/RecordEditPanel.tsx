import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useHistory, useParams } from 'react-router-dom';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { getSubdomainRecord, updateSubdomainRecord } from '@/api/admin/subdomains';
import RecordFormFields, { RecordFormState } from '@/components/admin-preview/subdomains/RecordFormFields';
import { SettingsFooter, SettingsSection } from '@/components/admin-preview/settings/settingsLayout';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';

export default () => {
    const { id } = useParams<{ id: string }>();
    const recordId = Number(id);
    const history = useHistory();
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data, error, isValidating } = useSWR(
        Number.isFinite(recordId) ? `admin-subdomain-record-${recordId}` : null,
        () => getSubdomainRecord(recordId)
    );
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
        if (data?.record) {
            setForm({
                name: data.record.name,
                domain_id: data.record.domain_id,
                egg_ids: data.egg_ids ?? [],
                type: data.record.type,
                ttl: data.record.ttl ?? '3600',
                protocol: data.record.protocol ?? 'tcp',
                priority: data.record.priority ?? '0',
                weight: data.record.weight ?? '5',
                service: data.record.service ?? '_minecraft',
            });
        }
    }, [data]);

    const updateField = <K extends keyof RecordFormState>(key: K, value: RecordFormState[K]) => {
        setForm((current) => (current ? { ...current, [key]: value } : current));
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

        updateSubdomainRecord(recordId, {
            ...form,
            domain_id: form.domain_id,
        })
            .then((response) => {
                addFlash({
                    key: 'admin-subdomains',
                    type: 'success',
                    title: 'Record updated',
                    message: response.message,
                });
                history.push(`${adminPreviewBasePath}/subdomains/records`);
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
        return <p className="text-sm text-muted-foreground">Unable to load record template.</p>;
    }

    const domainName =
        data.domains.find((domain) => domain.id === data.record.domain_id)?.name ?? 'Unknown domain';

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <SettingsSection
                title={data.record.name}
                description={`${data.record.type} record for ${domainName}.`}
            >
                <RecordFormFields
                    form={form}
                    domains={data.domains}
                    eggs={data.eggs}
                    onChange={updateField}
                    onToggleEgg={onToggleEgg}
                />
            </SettingsSection>

            <SettingsFooter>
                <Link to={`${adminPreviewBasePath}/subdomains/records`} className="no-underline">
                    <Button type="button" variant="outline">
                        Cancel
                    </Button>
                </Link>
                <Button type="submit" disabled={saving || form.egg_ids.length === 0}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save changes'}
                </Button>
            </SettingsFooter>
        </form>
    );
};
