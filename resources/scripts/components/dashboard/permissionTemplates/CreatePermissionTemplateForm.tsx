import React from 'react';
import { Form, Formik, FormikHelpers } from 'formik';
import { array, object, string } from 'yup';
import { Actions, useStoreActions, useStoreState } from 'easy-peasy';
import tw from 'twin.macro';
import { ApplicationStore } from '@/state';
import Label from '@/components/elements/Label';
import Input from '@/components/elements/Input';
import { Button } from '@/components/elements/button/index';
import PermissionSection from '@/components/server/users/PermissionSection';
import PermissionRow from '@/components/server/users/PermissionRow';
import { createPermissionTemplate } from '@/api/account/permissionTemplates';
import { useFlashKey } from '@/plugins/useFlash';

interface Values {
    name: string;
    permissions: string[];
}

export default () => {
    const { clearAndAddHttpError } = useFlashKey('account:permission-templates');
    const permissions = useStoreState((state: ApplicationStore) => state.permissions.data);
    const appendTemplate = useStoreActions(
        (actions: Actions<ApplicationStore>) => actions.permissionTemplates.appendTemplate
    );

    const submit = (values: Values, { setSubmitting, resetForm }: FormikHelpers<Values>) => {
        clearAndAddHttpError();

        createPermissionTemplate(values.name, values.permissions)
            .then((template) => {
                appendTemplate(template);
                resetForm();
            })
            .catch((error) => clearAndAddHttpError(error))
            .then(() => setSubmitting(false));
    };

    return (
        <Formik
            onSubmit={submit}
            initialValues={{ name: '', permissions: [] } as Values}
            validationSchema={object().shape({
                name: string().required('Enter a name for this template.').max(191),
                permissions: array().of(string()),
            })}
        >
            {({ values, handleChange, handleBlur, isSubmitting }) => (
                <Form css={tw`space-y-4`}>
                    <div>
                        <Label>Template name</Label>
                        <Input
                            name={'name'}
                            value={values.name}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder={'Moderator'}
                            className={'w-full mt-1'}
                        />
                    </div>
                    <div
                        className={
                            'max-h-96 overflow-y-auto pr-1 rounded-md bg-realm-surface border border-realm-border p-3'
                        }
                    >
                        {Object.keys(permissions)
                            .filter((key) => key !== 'websocket')
                            .map((key) => (
                                <PermissionSection
                                    key={`permission_${key}`}
                                    title={key}
                                    description={permissions[key].description}
                                    isEditable
                                    permissions={Object.keys(permissions[key].keys).map((pkey) => `${key}.${pkey}`)}
                                >
                                    <div className={'flex flex-col gap-0.5'}>
                                        {Object.keys(permissions[key].keys).map((pkey) => (
                                            <PermissionRow
                                                key={`permission_${key}.${pkey}`}
                                                permission={`${key}.${pkey}`}
                                                disabled={false}
                                                compact
                                            />
                                        ))}
                                    </div>
                                </PermissionSection>
                            ))}
                    </div>
                    <div css={tw`flex justify-end`}>
                        <Button type={'submit'} size={Button.Sizes.Small} disabled={isSubmitting}>
                            {isSubmitting ? 'Saving…' : 'Save template'}
                        </Button>
                    </div>
                </Form>
            )}
        </Formik>
    );
};
