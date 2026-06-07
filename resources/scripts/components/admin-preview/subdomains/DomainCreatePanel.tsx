import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useHistory } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { createSubdomainDomain, getSubdomainDomainCreateMeta } from '@/api/admin/subdomains';
import DomainFormFields, { DomainFormState } from '@/components/admin-preview/subdomains/DomainFormFields';
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
            .then((response) => {
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
        <form onSubmit={onSubmit} className="space-y-6">
            <Link
                to={`${adminPreviewBasePath}/subdomains`}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground no-underline hover:text-foreground"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to domains
            </Link>

            <div className="rounded-lg border border-border bg-card">
                <div className="border-b border-border px-5 py-4">
                    <h2 className="text-base font-semibold text-foreground">New domain</h2>
                </div>
                <div className="p-5">
                    <DomainFormFields form={form} providers={data.providers} onChange={updateField} />
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
