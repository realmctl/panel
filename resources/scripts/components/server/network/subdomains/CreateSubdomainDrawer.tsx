import React, { useEffect, useState } from 'react';
import { Form, Formik, FormikHelpers } from 'formik';
import { object, string } from 'yup';
import Drawer from '@/components/elements/Drawer';
import Field from '@/components/elements/Field';
import Select from '@/components/elements/Select';
import Label from '@/components/elements/Label';
import { Button } from '@/components/elements/button/index';
import { ServerContext } from '@/state/server';
import { useFlashKey } from '@/plugins/useFlash';
import createSubdomain from '@/api/server/network/subdomains/createSubdomain';
import getSubdomains, { SubdomainTemplate } from '@/api/server/network/subdomains/getSubdomains';
import tw from 'twin.macro';

interface Values {
    name: string;
}

const schema = object().shape({
    name: string()
        .required('A subdomain name must be provided.')
        .min(3, 'Subdomain name must be at least 3 characters.')
        .max(48, 'Subdomain name must not exceed 48 characters.')
        .matches(/^[A-Za-z0-9]+$/, 'Subdomain name should only contain alphanumeric characters.'),
});

interface Props {
    visible: boolean;
    templates: SubdomainTemplate[];
    onDismissed: () => void;
}

const CreateSubdomainDrawer = ({ visible, templates, onDismissed }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { clearFlashes, clearAndAddHttpError } = useFlashKey('server:network');
    const { mutate } = getSubdomains();
    const [domain, setDomain] = useState(() => templates[0]?.domain ?? '');
    const [template, setTemplate] = useState<SubdomainTemplate | null>(() => templates[0] ?? null);

    useEffect(() => {
        if (!visible || templates.length === 0) {
            return;
        }

        setTemplate(templates[0]);
        setDomain(templates[0].domain);
    }, [visible, templates]);

    useEffect(() => {
        const filtered = templates.filter((item) => item.domain === domain);
        if (filtered.length > 0) {
            setTemplate(filtered[0]);
        }
    }, [domain, templates]);

    const domainTemplates = templates.filter((item) => item.domain === domain);

    const handleDismiss = () => {
        onDismissed();
    };

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes();

        if (!template) {
            clearAndAddHttpError({ message: 'Template not found.' });
            setSubmitting(false);
            return;
        }

        createSubdomain(uuid, template.id, values.name)
            .then(() => {
                mutate();
                onDismissed();
            })
            .catch((error) => clearAndAddHttpError(error))
            .then(() => setSubmitting(false));
    };

    return (
        <Formik onSubmit={submit} initialValues={{ name: '' }} validationSchema={schema} enableReinitialize>
            {({ isSubmitting, resetForm, values }) => (
                <Drawer
                    visible={visible}
                    onDismissed={() => {
                        resetForm();
                        handleDismiss();
                    }}
                    title={'New Subdomain'}
                    subtitle={values.name && domain ? `${values.name}.${domain}` : domain || undefined}
                    width={'28rem'}
                    dismissable={!isSubmitting}
                    closeOnBackground={!isSubmitting}
                    closeOnEscape={!isSubmitting}
                >
                    <Form css={tw`space-y-4 flex-1 m-0`}>
                        <Field type={'string'} id={'name'} name={'name'} label={'Subdomain name'} />

                        <div>
                            <Label>Domain</Label>
                            <Select
                                onChange={(e) => setDomain(e.target.value)}
                                value={domain}
                                disabled={templates.length === 0}
                                className={'h-12'}
                            >
                                {[...new Set(templates.map((item) => item.domain))].map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </Select>
                        </div>

                        <div>
                            <Label>Record template</Label>
                            <Select
                                onChange={(e) => {
                                    const selected = domainTemplates.find((item) => item.id === Number(e.target.value));
                                    if (selected) setTemplate(selected);
                                }}
                                value={template?.id ?? ''}
                                disabled={domainTemplates.length === 0}
                                className={'h-12'}
                            >
                                {domainTemplates.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name}
                                    </option>
                                ))}
                            </Select>
                        </div>

                        <div css={tw`mt-6 pt-4 border-t border-realm-border flex justify-end gap-3`}>
                            <Button.Text
                                size={Button.Sizes.Small}
                                type={'button'}
                                onClick={handleDismiss}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button.Text>
                            <Button
                                size={Button.Sizes.Small}
                                type={'submit'}
                                disabled={isSubmitting || !template}
                            >
                                {isSubmitting ? 'Creating…' : 'Create subdomain'}
                            </Button>
                        </div>
                    </Form>
                </Drawer>
            )}
        </Formik>
    );
};

export default CreateSubdomainDrawer;
