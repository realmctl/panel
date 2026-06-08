import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useHistory } from 'react-router-dom';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { createSubdomainDomain, getSubdomainDomainCreateMeta } from '@/api/admin/subdomains';
import DomainFormFields, { DomainFormState } from '@/components/admin-preview/subdomains/DomainFormFields';
import { SettingsFooter, SettingsSection } from '@/components/admin-preview/settings/settingsLayout';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';

const defaultForm = (): DomainFormState => ({
    name: '',
    type: 'cloudflare',
    key: '',
    secret: '',
    consumer: '',
    cloudflare_id: '',
    ovh_api: 'eu',
});

export default () => {
    const history = useHistory();
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data, error, isValidating } = useSWR('admin-subdomain-domains-create', getSubdomainDomainCreateMeta);
    const [form, setForm] = useState<DomainFormState>(defaultForm);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-subdomains', error });
        } else {
            clearFlashes('admin-subdomains');
        }
    }, [error]);

    useEffect(() => {
        if (data?.providers && !data.providers[form.type]) {
            const firstType = Object.keys(data.providers)[0];
            if (firstType) {
                setForm((current) => ({ ...current, type: firstType }));
            }
        }
    }, [data]);

    const updateField = <K extends keyof DomainFormState>(key: K, value: DomainFormState[K]) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!form.key) return;

        setSaving(true);
        clearFlashes('admin-subdomains');

        createSubdomainDomain(form)
            .then((response: any) => {
                addFlash({
                    key: 'admin-subdomains',
                    type: 'success',
                    title: 'Domain created',
                    message: response.message,
                });
                history.push(`${adminPreviewBasePath}/subdomains/${response.domain!.id}`);
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-subdomains', error: submitError });
            })
            .finally(() => setSaving(false));
    };

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    if (!data) {
        return <p className="text-sm text-muted-foreground">Unable to load domain form.</p>;
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <SettingsSection
                title="New domain"
                description="Connect a DNS provider so customers can create subdomains."
            >
                <DomainFormFields form={form} providers={data.providers} onChange={updateField} />
            </SettingsSection>

            <SettingsFooter>
                <Link to={`${adminPreviewBasePath}/subdomains`} className="no-underline">
                    <Button type="button" variant="outline">
                        Cancel
                    </Button>
                </Link>
                <Button type="submit" disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Creating...' : 'Create domain'}
                </Button>
            </SettingsFooter>
        </form>
    );
};
