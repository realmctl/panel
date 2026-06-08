import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useHistory, useParams } from 'react-router-dom';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { getSubdomainDomain, updateSubdomainDomain } from '@/api/admin/subdomains';
import DomainFormFields, { DomainFormState } from '@/components/admin-preview/subdomains/DomainFormFields';
import { SettingsFooter, SettingsSection } from '@/components/admin-preview/settings/settingsLayout';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';

export default () => {
    const { id } = useParams<{ id: string }>();
    const domainId = Number(id);
    const history = useHistory();
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data, error, isValidating } = useSWR(
        Number.isFinite(domainId) ? `admin-subdomain-domain-${domainId}` : null,
        () => getSubdomainDomain(domainId)
    );
    const [form, setForm] = useState<DomainFormState | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-subdomains', error });
        } else {
            clearFlashes('admin-subdomains');
        }
    }, [error]);

    useEffect(() => {
        if (data?.domain) {
            setForm({
                name: data.domain.name,
                type: data.domain.type,
                key: '',
                secret: '',
                consumer: '',
                cloudflare_id: data.domain.cloudflare_id ?? '',
                ovh_api: data.domain.ovh_api ?? 'eu',
            });
        }
    }, [data]);

    const updateField = <K extends keyof DomainFormState>(key: K, value: DomainFormState[K]) => {
        setForm((current) => (current ? { ...current, [key]: value } : current));
    };

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!form?.key) return;

        setSaving(true);
        clearFlashes('admin-subdomains');

        updateSubdomainDomain(domainId, form)
            .then((response: any) => {
                addFlash({
                    key: 'admin-subdomains',
                    type: 'success',
                    title: 'Domain updated',
                    message: response.message,
                });
                history.push(`${adminPreviewBasePath}/subdomains`);
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
        return <p className="text-sm text-muted-foreground">Unable to load domain.</p>;
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <SettingsSection
                title={data.domain.name}
                description={`${data.domain.display_type} · Re-enter credentials to update stored values.`}
            >
                <DomainFormFields form={form} providers={data.providers} onChange={updateField} isEdit />
            </SettingsSection>

            <SettingsFooter>
                <Link to={`${adminPreviewBasePath}/subdomains`} className="no-underline">
                    <Button type="button" variant="outline">
                        Cancel
                    </Button>
                </Link>
                <Button type="submit" disabled={saving || !form.key}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save changes'}
                </Button>
            </SettingsFooter>
        </form>
    );
};
