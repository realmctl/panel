import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useHistory } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { createEgg, getEggCreateMeta } from '@/api/admin/nests';
import EggFormFields, { EggFormState, formToEggPayload } from '@/components/admin-preview/nests/EggFormFields';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';

const defaultForm = (): EggFormState => ({
    nest_id: null,
    name: '',
    description: '',
    background: '',
    docker_images: '',
    force_outgoing_ip: false,
    startup: '',
    features: '',
    config_from: null,
    config_stop: '',
    config_logs: '',
    config_files: '',
    config_startup: '',
});

export default () => {
    const history = useHistory();
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data, error, isValidating } = useSWR('admin-eggs-create', getEggCreateMeta);
    const [form, setForm] = useState(defaultForm);
    const [saving, setSaving] = useState(false);
    const [nestEggs, setNestEggs] = useState<{ id: number; name: string; author: string }[]>([]);

    useEffect(() => {
        if (error) clearAndAddHttpError({ key: 'admin-nests', error });
        else clearFlashes('admin-nests');
    }, [error]);

    useEffect(() => {
        if (data?.nests[0] && form.nest_id === null) {
            setForm((c) => ({ ...c, nest_id: data.nests[0].id }));
        }
    }, [data, form.nest_id]);

    useEffect(() => {
        if (data && form.nest_id) {
            const nest = data.nests.find((n) => n.id === form.nest_id);
            setNestEggs(nest?.eggs ?? []);
        }
    }, [data, form.nest_id]);

    const updateField = <K extends keyof EggFormState>(key: K, value: EggFormState[K]) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        setSaving(true);
        createEgg(formToEggPayload(form))
            .then((response) => {
                addFlash({ key: 'admin-nests', type: 'success', title: 'Egg created', message: response.message });
                history.push(`${adminPreviewBasePath}/nests/eggs/${response.egg!.id}`);
            })
            .catch((e) => clearAndAddHttpError({ key: 'admin-nests', error: e }))
            .finally(() => setSaving(false));
    };

    if (!data && isValidating) return <Spinner centered />;
    if (!data) return <p className="text-sm text-muted-foreground">Unable to load egg form.</p>;

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <Link
                to={`${adminPreviewBasePath}/nests`}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground no-underline hover:text-foreground"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to nests
            </Link>
            <div className="rounded-lg border border-border bg-card">
                <div className="border-b border-border px-5 py-4">
                    <h2 className="text-base font-semibold text-foreground">New egg</h2>
                </div>
                <div className="p-5">
                    <EggFormFields
                        form={form}
                        nests={data.nests}
                        nestEggs={nestEggs}
                        showNestSelect
                        onChange={updateField}
                    />
                </div>
                <div className="flex justify-end border-t border-border px-5 py-4">
                    <Button type="submit" disabled={saving}>
                        <Save className="mr-2 h-4 w-4" />
                        Create
                    </Button>
                </div>
            </div>
        </form>
    );
};
