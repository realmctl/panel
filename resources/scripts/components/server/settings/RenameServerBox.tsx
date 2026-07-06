import React, { useState } from 'react';
import { CodeIcon, DocumentTextIcon, IdentificationIcon, PencilIcon, PuzzleIcon } from '@heroicons/react/outline';
import { Field as FormikField, Form, Formik, FormikHelpers } from 'formik';
import { object, string } from 'yup';
import { ServerContext } from '@/state/server';
import { Actions, useStoreActions } from 'easy-peasy';
import renameServer from '@/api/server/renameServer';
import { ApplicationStore } from '@/state';
import { httpErrorToHuman } from '@/api/http';
import { Button } from '@/components/elements/button/index';
import Field from '@/components/elements/Field';
import Label from '@/components/elements/Label';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import { Textarea } from '@/components/elements/Input';
import Modal from '@/components/elements/Modal';
import RealmCard from '@/components/elements/realm/RealmCard';
import { DetailGroup, DetailRow } from '@/components/server/settings/DetailRow';

interface Values {
    name: string;
    description: string;
}

interface ModalProps {
    visible: boolean;
    onDismissed: () => void;
}

const EditServerDetailsModal = ({ visible, onDismissed }: ModalProps) => {
    const server = ServerContext.useStoreState((state) => state.server.data!);
    const setServer = ServerContext.useStoreActions((actions) => actions.server.setServer);
    const { addError, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const submit = ({ name, description }: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('settings');
        renameServer(server.uuid, name, description)
            .then(() => {
                setServer({ ...server, name, description });
                onDismissed();
            })
            .catch((error) => {
                console.error(error);
                addError({ key: 'settings', message: httpErrorToHuman(error) });
            })
            .then(() => setSubmitting(false));
    };

    return (
        <Formik
            onSubmit={submit}
            initialValues={{ name: server.name, description: server.description }}
            validationSchema={object().shape({
                name: string().required().min(1),
                description: string().nullable(),
            })}
            enableReinitialize
        >
            {({ isSubmitting, submitForm }) => (
                <Modal
                    visible={visible}
                    onDismissed={onDismissed}
                    dismissable={!isSubmitting}
                    closeOnBackground={!isSubmitting}
                    closeOnEscape={!isSubmitting}
                    showSpinnerOverlay={isSubmitting}
                    title={'Edit Server Details'}
                    footer={
                        <>
                            <Button.Text size={Button.Sizes.Small} onClick={onDismissed} disabled={isSubmitting}>
                                Cancel
                            </Button.Text>
                            <Button size={Button.Sizes.Small} onClick={submitForm} disabled={isSubmitting}>
                                {isSubmitting ? 'Saving…' : 'Save'}
                            </Button>
                        </>
                    }
                >
                    <Form className={'m-0'}>
                        <Field id={'name'} name={'name'} label={'Server Name'} type={'text'} />
                        <div className={'mt-6'}>
                            <Label>Server Description</Label>
                            <FormikFieldWrapper name={'description'}>
                                <FormikField as={Textarea} name={'description'} rows={3} />
                            </FormikFieldWrapper>
                        </div>
                    </Form>
                </Modal>
            )}
        </Formik>
    );
};

export default () => {
    const server = ServerContext.useStoreState((state) => state.server.data!);
    const [visible, setVisible] = useState(false);

    return (
        <>
            <EditServerDetailsModal visible={visible} onDismissed={() => setVisible(false)} />
            <RealmCard
                rounded={'md'}
                border={'soft'}
                header={
                    <div className={'flex items-center justify-between gap-3'}>
                        <h2 className={'text-base font-semibold text-neutral-100 m-0'}>Server Details</h2>
                        <button
                            type={'button'}
                            onClick={() => setVisible(true)}
                            className={
                                'flex items-center gap-1 bg-transparent border-0 p-0 text-xs font-medium text-blue-600 hover:text-blue-500 cursor-pointer'
                            }
                        >
                            <PencilIcon className={'w-3.5 h-3.5'} />
                            Manage
                        </button>
                    </div>
                }
                headerClassName={'!py-2.5 !bg-realm-card !border-realm-border/50'}
                bodyClassName={'space-y-2.5'}
            >
                <DetailGroup label={'General'} />
                <DetailRow icon={IdentificationIcon} label={'Name'} value={server.name} />
                <DetailRow
                    icon={DocumentTextIcon}
                    align={'start'}
                    label={'Description'}
                    value={server.description || 'No description set.'}
                />
                <DetailRow icon={PuzzleIcon} label={'Egg'} value={server.eggName} />
                {server.installedSoftware && (
                    <DetailRow
                        icon={CodeIcon}
                        label={'Software'}
                        value={`${server.installedSoftware}${
                            server.installedVersion ? ` (${server.installedVersion})` : ''
                        }`}
                    />
                )}
            </RealmCard>
        </>
    );
};
