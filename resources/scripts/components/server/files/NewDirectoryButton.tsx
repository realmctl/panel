import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolderPlus } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';
import { ServerContext } from '@/state/server';
import { Form, Formik, FormikHelpers } from 'formik';
import Field from '@/components/elements/Field';
import { join, normalize } from 'pathe';
import { object, string } from 'yup';
import createDirectory from '@/api/server/files/createDirectory';
import tw from 'twin.macro';
import { Button as ToolbarButton } from '@/components/elements/button/index';
import Button from '@/components/elements/Button';
import { FileObject } from '@/api/server/files/loadDirectory';
import { useFlashKey } from '@/plugins/useFlash';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import { WithClassname } from '@/components/types';
import FlashMessageRender from '@/components/FlashMessageRender';
import Code from '@/components/elements/Code';
import Modal, { RequiredModalProps } from '@/components/elements/Modal';

interface Values {
    directoryName: string;
}

const schema = object().shape({
    directoryName: string().required('A valid directory name must be provided.'),
});

const displayNameForDirectory = (name: string): string =>
    normalize(name)
        .replace(/^(\.\.\/|\/)+/, '')
        .split('/', 1)[0] || name;

const generateDirectoryData = (name: string): FileObject => {
    const displayName = displayNameForDirectory(name);

    return {
        key: `dir_${displayName}`,
        name: displayName,
        mode: 'drwxr-xr-x',
        modeBits: '0755',
        size: 0,
        isFile: false,
        isSymlink: false,
        mimetype: '',
        createdAt: new Date(),
        modifiedAt: new Date(),
        isArchiveType: () => false,
        isEditable: () => false,
    };
};

const NewDirectoryModal = (props: RequiredModalProps) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const directory = ServerContext.useStoreState((state) => state.files.directory);

    const { mutate } = useFileManagerSwr();
    const { clearAndAddHttpError } = useFlashKey('files:directory-modal');

    const submit = ({ directoryName }: Values, { setSubmitting, resetForm }: FormikHelpers<Values>) => {
        createDirectory(uuid, directory, directoryName)
            .then(() => mutate((data) => [...data, generateDirectoryData(directoryName)], false))
            .then(() => {
                resetForm();
                props.onDismissed();
            })
            .catch((error) => {
                setSubmitting(false);
                clearAndAddHttpError(error);
            });
    };

    return (
        <Formik onSubmit={submit} validationSchema={schema} initialValues={{ directoryName: '' }}>
            {({ submitForm, values, isSubmitting }) => (
                <Modal {...props} title={'Create Directory'} dismissable={!isSubmitting}>
                    <FlashMessageRender key={'files:directory-modal'} />
                    <Form css={tw`m-0`}>
                        <Field autoFocus id={'directoryName'} name={'directoryName'} label={'Name'} />
                        <p css={tw`mt-2 text-sm md:text-base break-all`}>
                            <span css={tw`text-neutral-200`}>This directory will be created as&nbsp;</span>
                            <Code>
                                /home/container/
                                <span css={tw`text-cyan-200`}>
                                    {join(directory, values.directoryName).replace(/^(\.\.\/|\/)+/, '')}
                                </span>
                            </Code>
                        </p>
                        <div css={tw`mt-6 text-right`}>
                            <Button type={'button'} onClick={submitForm}>
                                Create
                            </Button>
                        </div>
                    </Form>
                </Modal>
            )}
        </Formik>
    );
};

export default ({ className }: WithClassname) => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <NewDirectoryModal visible={open} onDismissed={() => setOpen(false)} />
            <ToolbarButton.Text
                onClick={() => setOpen(true)}
                className={classNames('flex items-center gap-1.5', className)}
            >
                <FontAwesomeIcon icon={faFolderPlus} className={'text-xs'} />
                Create Directory
            </ToolbarButton.Text>
        </>
    );
};
