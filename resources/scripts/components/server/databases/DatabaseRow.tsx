import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDatabase, faEye, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import Modal from '@/components/elements/Modal';
import { Form, Formik, FormikHelpers } from 'formik';
import Field from '@/components/elements/Field';
import { object, string } from 'yup';
import FlashMessageRender from '@/components/FlashMessageRender';
import { ServerContext } from '@/state/server';
import deleteServerDatabase from '@/api/server/databases/deleteServerDatabase';
import { httpErrorToHuman } from '@/api/http';
import RotatePasswordButton from '@/components/server/databases/RotatePasswordButton';
import Can from '@/components/elements/Can';
import { ServerDatabase } from '@/api/server/databases/getServerDatabases';
import useFlash from '@/plugins/useFlash';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';
import Label from '@/components/elements/Label';
import Input from '@/components/elements/Input';
import GreyRowBox from '@/components/elements/GreyRowBox';
import CopyOnClick from '@/components/elements/CopyOnClick';

interface Props {
    database: ServerDatabase;
    className?: string;
}

export default ({ database, className }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { addError, clearFlashes } = useFlash();
    const [visible, setVisible] = useState(false);
    const [connectionVisible, setConnectionVisible] = useState(false);

    const updateDatabase = ServerContext.useStoreActions((actions) => actions.databases.updateDatabase);
    const removeDatabase = ServerContext.useStoreActions((actions) => actions.databases.removeDatabase);

    const jdbcConnectionString = `jdbc:mysql://${database.username}${
        database.password ? `:${encodeURIComponent(database.password)}` : ''
    }@${database.connectionString}/${database.name}`;

    const schema = object().shape({
        confirm: string()
            .required('The database name must be provided.')
            .oneOf([database.name.split('_', 2)[1], database.name], 'The database name must be provided.'),
    });

    const submit = (values: { confirm: string }, { setSubmitting }: FormikHelpers<{ confirm: string }>) => {
        clearFlashes();
        deleteServerDatabase(uuid, database.id)
            .then(() => {
                setVisible(false);
                setTimeout(() => removeDatabase(database.id), 150);
            })
            .catch((error) => {
                console.error(error);
                setSubmitting(false);
                addError({ key: 'database:delete', message: httpErrorToHuman(error) });
            });
    };

    return (
        <>
            <Formik onSubmit={submit} initialValues={{ confirm: '' }} validationSchema={schema} isInitialValid={false}>
                {({ isSubmitting, isValid, resetForm }) => (
                    <Modal
                        visible={visible}
                        dismissable={!isSubmitting}
                        showSpinnerOverlay={isSubmitting}
                        onDismissed={() => {
                            setVisible(false);
                            resetForm();
                        }}
                    >
                        <FlashMessageRender byKey={'database:delete'} css={tw`mb-6`} />
                        <h2 css={tw`text-2xl mb-6`}>Confirm database deletion</h2>
                        <p css={tw`text-sm`}>
                            Deleting a database is a permanent action, it cannot be undone. This will permanently delete
                            the <strong>{database.name}</strong> database and remove all associated data.
                        </p>
                        <Form css={tw`m-0 mt-6`}>
                            <Field
                                type={'text'}
                                id={'confirm_name'}
                                name={'confirm'}
                                label={'Confirm Database Name'}
                                description={'Enter the database name to confirm deletion.'}
                            />
                            <div css={tw`mt-6 text-right`}>
                                <Button type={'button'} isSecondary css={tw`mr-2`} onClick={() => setVisible(false)}>
                                    Cancel
                                </Button>
                                <Button type={'submit'} color={'red'} disabled={!isValid}>
                                    Delete Database
                                </Button>
                            </div>
                        </Form>
                    </Modal>
                )}
            </Formik>
            <Modal visible={connectionVisible} onDismissed={() => setConnectionVisible(false)}>
                <FlashMessageRender byKey={'database-connection-modal'} css={tw`mb-6`} />
                <h3 css={tw`mb-6 text-2xl`}>Database connection details</h3>
                <div>
                    <Label>Endpoint</Label>
                    <CopyOnClick text={database.connectionString}>
                        <Input type={'text'} readOnly value={database.connectionString} />
                    </CopyOnClick>
                </div>
                <div css={tw`mt-6`}>
                    <Label>Connections from</Label>
                    <Input type={'text'} readOnly value={database.allowConnectionsFrom} />
                </div>
                <div css={tw`mt-6`}>
                    <Label>Username</Label>
                    <CopyOnClick text={database.username}>
                        <Input type={'text'} readOnly value={database.username} />
                    </CopyOnClick>
                </div>
                <Can action={'database.view_password'}>
                    <div css={tw`mt-6`}>
                        <Label>Password</Label>
                        <CopyOnClick text={database.password} showInNotification={false}>
                            <Input type={'text'} readOnly value={database.password} />
                        </CopyOnClick>
                    </div>
                </Can>
                <div css={tw`mt-6`}>
                    <Label>JDBC Connection String</Label>
                    <CopyOnClick text={jdbcConnectionString} showInNotification={false}>
                        <Input type={'text'} readOnly value={jdbcConnectionString} />
                    </CopyOnClick>
                </div>
                <div css={tw`mt-6 text-right`}>
                    <Can action={'database.update'}>
                        <RotatePasswordButton databaseId={database.id} onUpdate={updateDatabase} />
                    </Can>
                    <Button isSecondary onClick={() => setConnectionVisible(false)}>
                        Close
                    </Button>
                </div>
            </Modal>
            <div className={className} style={{ backgroundColor: '#192024' }}>
                <div className={'rounded-md border border-[#2d3338]/50 p-5'}>
                    <div className={'flex items-center gap-3 mb-4'}>
                        <div className={'flex items-center justify-center w-9 h-9 rounded-lg bg-blue-500/20'}>
                            <FontAwesomeIcon icon={faDatabase} className={'text-blue-400'} />
                        </div>
                        <div>
                            <CopyOnClick text={database.name}>
                                <p className={'text-sm font-semibold text-neutral-100 m-0'}>{database.name}</p>
                            </CopyOnClick>
                        </div>
                    </div>
                    <div className={'space-y-2.5 mb-4'}>
                        <div className={'flex items-center'}>
                            <span className={'text-xs text-neutral-500 uppercase w-28'}>Username</span>
                            <CopyOnClick text={database.username}>
                                <span className={'text-xs text-neutral-200 font-mono'}>{database.username}</span>
                            </CopyOnClick>
                        </div>
                        <div className={'flex items-center'}>
                            <span className={'text-xs text-neutral-500 uppercase w-28'}>Endpoint</span>
                            <CopyOnClick text={database.connectionString}>
                                <span className={'text-xs text-neutral-200 font-mono'}>{database.connectionString}</span>
                            </CopyOnClick>
                        </div>
                        <div className={'flex items-center'}>
                            <span className={'text-xs text-neutral-500 uppercase w-28'}>Connections</span>
                            <span className={'text-xs text-neutral-200'}>{database.allowConnectionsFrom}</span>
                        </div>
                    </div>
                    <div className={'flex items-center justify-between pt-3 border-t border-[#2d3338]/50'}>
                        <div className={'flex items-center gap-1'}>
                            <button
                                onClick={() => setConnectionVisible(true)}
                                className={'flex items-center justify-center w-8 h-8 rounded-md text-neutral-400 hover:text-neutral-100 hover:bg-neutral-700/50 bg-transparent border-0 cursor-pointer transition-colors duration-150'}
                                title={'View details'}
                            >
                                <FontAwesomeIcon icon={faEye} size={'sm'} />
                            </button>
                        </div>
                        <Can action={'database.delete'}>
                            <button
                                onClick={() => setVisible(true)}
                                className={'flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 bg-transparent border-0 cursor-pointer transition-colors duration-150'}
                            >
                                <FontAwesomeIcon icon={faTrashAlt} size={'sm'} />
                                Delete
                            </button>
                        </Can>
                    </div>
                </div>
            </div>
        </>
    );
};
