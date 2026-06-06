import React, { useContext, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLink } from '@fortawesome/free-solid-svg-icons';
import { ServerContext } from '@/state/server';
import { Form, Formik, FormikHelpers } from 'formik';
import Field from '@/components/elements/Field';
import { join } from 'pathe';
import { object, string } from 'yup';
import pullFile from '@/api/server/files/pullFile';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import { useFlashKey } from '@/plugins/useFlash';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import { WithClassname } from '@/components/types';
import FlashMessageRender from '@/components/FlashMessageRender';
import { Dialog, DialogWrapperContext } from '@/components/elements/dialog';
import Code from '@/components/elements/Code';
import asDialog from '@/hoc/asDialog';
import styles from './style.module.css';
import ExplorerIconTooltip from '@/components/server/files/ExplorerIconTooltip';

interface Values {
    url: string;
    filename: string;
}

const schema = object().shape({
    url: string().url('Enter a valid URL.').required('A URL is required.'),
    filename: string(),
});

const PullFileDialog = asDialog({
    title: 'Import from URL',
})(({ onImported }: { onImported?: () => void }) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const directory = ServerContext.useStoreState((state) => state.files.directory);

    const { mutate } = useFileManagerSwr();
    const { close } = useContext(DialogWrapperContext);
    const { clearAndAddHttpError } = useFlashKey('files:pull-modal');

    useEffect(() => {
        return () => {
            clearAndAddHttpError();
        };
    }, []);

    const submit = ({ url, filename }: Values, { setSubmitting }: FormikHelpers<Values>) => {
        pullFile(uuid, url, directory, filename.trim() || undefined)
            .then(() => mutate())
            .then(() => onImported?.())
            .then(() => close())
            .catch((error) => {
                setSubmitting(false);
                clearAndAddHttpError(error);
            });
    };

    return (
        <Formik onSubmit={submit} validationSchema={schema} initialValues={{ url: '', filename: '' }}>
            {({ submitForm, values }) => (
                <>
                    <FlashMessageRender key={'files:pull-modal'} />
                    <Form css={tw`m-0`}>
                        <Field autoFocus id={'url'} name={'url'} label={'File URL'} placeholder={'https://example.com/plugin.jar'} />
                        <div css={tw`mt-4`}>
                            <Field
                                id={'filename'}
                                name={'filename'}
                                label={'Filename (optional)'}
                                placeholder={'Leave blank to use the remote filename'}
                            />
                        </div>
                        <p css={tw`mt-2 text-sm md:text-base break-all`}>
                            <span css={tw`text-neutral-200`}>The file will be downloaded to&nbsp;</span>
                            <Code>
                                /home/container/
                                <span css={tw`text-cyan-200`}>
                                    {join(directory, values.filename || '…').replace(/^(\.\.\/|\/)+/, '')}
                                </span>
                            </Code>
                        </p>
                    </Form>
                    <Dialog.Footer>
                        <Button.Text className={'w-full sm:w-auto'} onClick={close}>
                            Cancel
                        </Button.Text>
                        <Button className={'w-full sm:w-auto'} onClick={submitForm}>
                            Import
                        </Button>
                    </Dialog.Footer>
                </>
            )}
        </Formik>
    );
});

export default ({
    className,
    onImported,
    iconOnly = false,
}: WithClassname & { onImported?: () => void; iconOnly?: boolean }) => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <PullFileDialog open={open} onClose={setOpen.bind(this, false)} onImported={onImported} />
            {iconOnly ? (
                <ExplorerIconTooltip label={'Import URL'}>
                    <button type={'button'} className={styles.explorer_icon_btn} onClick={() => setOpen(true)}>
                        <FontAwesomeIcon icon={faLink} className={'text-sm'} />
                    </button>
                </ExplorerIconTooltip>
            ) : (
                <Button.Text onClick={setOpen.bind(this, true)} className={className}>
                    Import URL
                </Button.Text>
            )}
        </>
    );
};
