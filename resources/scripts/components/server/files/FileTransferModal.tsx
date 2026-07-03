import React, { useEffect, useState } from 'react';
import Modal, { RequiredModalProps } from '@/components/elements/Modal';
import { Form, Formik, FormikHelpers } from 'formik';
import Field from '@/components/elements/Field';
import Select from '@/components/elements/Select';
import Label from '@/components/elements/Label';
import Button from '@/components/elements/Button';
import tw from 'twin.macro';
import { ServerContext } from '@/state/server';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import useFlash from '@/plugins/useFlash';
import { getAllServers } from '@/api/getServers';
import { Server } from '@/api/server/getServer';
import transferFiles from '@/api/server/files/transferFiles';

interface FormikValues {
    destination: string;
    destinationDirectory: string;
}

type OwnProps = RequiredModalProps & {
    files: string[];
    move?: boolean;
};

const FileTransferModal = ({ files, move, ...props }: OwnProps) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const { mutate } = useFileManagerSwr();
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const setSelectedFiles = ServerContext.useStoreActions((actions) => actions.files.setSelectedFiles);

    const [servers, setServers] = useState<Server[] | null>(null);

    useEffect(() => {
        getAllServers()
            .then((list) => setServers(list.filter((s) => s.uuid !== uuid)))
            .catch((error) => clearAndAddHttpError({ key: 'files', error }));
    }, [uuid]);

    const submit = ({ destination, destinationDirectory }: FormikValues, { setSubmitting }: FormikHelpers<FormikValues>) => {
        clearFlashes('files');

        transferFiles(uuid, {
            destination,
            files,
            root: directory,
            destinationDirectory: destinationDirectory || '/',
            move: !!move,
        })
            .then(() => {
                // On a move the originals leave this directory, so refresh the listing.
                if (move) mutate();
                setSelectedFiles([]);
            })
            .catch((error) => {
                setSubmitting(false);
                clearAndAddHttpError({ key: 'files', error });
            })
            .then(() => props.onDismissed());
    };

    return (
        <Formik onSubmit={submit} initialValues={{ destination: '', destinationDirectory: '/' }}>
            {({ isSubmitting, values, setFieldValue }) => (
                <Modal
                    {...props}
                    dismissable={!isSubmitting}
                    showSpinnerOverlay={isSubmitting || servers === null}
                >
                    <Form css={tw`m-0`}>
                        <h2 css={tw`text-2xl mb-6`}>{move ? 'Move' : 'Copy'} to another server</h2>
                        <p css={tw`text-sm text-neutral-300 mb-4`}>
                            {move ? 'Moving' : 'Copying'} <strong>{files.length}</strong>{' '}
                            {files.length === 1 ? 'item' : 'items'} from{' '}
                            <code css={tw`text-neutral-200`}>{directory}</code>.
                        </p>
                        <div css={tw`mb-6`}>
                            <Label>Destination server</Label>
                            <Select
                                value={values.destination}
                                onChange={(e) => setFieldValue('destination', e.currentTarget.value)}
                            >
                                <option value={''} disabled>
                                    {servers && servers.length === 0
                                        ? 'No other servers available'
                                        : 'Select a server...'}
                                </option>
                                {(servers || []).map((s) => (
                                    <option key={s.uuid} value={s.uuid}>
                                        {s.name}
                                    </option>
                                ))}
                            </Select>
                        </div>
                        <div css={tw`mb-6`}>
                            <Field
                                type={'string'}
                                id={'destination_directory'}
                                name={'destinationDirectory'}
                                label={'Destination directory'}
                                description={'Path on the destination server where files will be placed.'}
                            />
                        </div>
                        <div css={tw`flex justify-end`}>
                            <Button type={'submit'} disabled={!values.destination || isSubmitting}>
                                {move ? 'Move Files' : 'Copy Files'}
                            </Button>
                        </div>
                    </Form>
                </Modal>
            )}
        </Formik>
    );
};

export default FileTransferModal;
