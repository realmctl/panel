import React, { useState } from 'react';
import tw from 'twin.macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { Actions, useStoreActions } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { Dialog } from '@/components/elements/dialog';
import Code from '@/components/elements/Code';
import { deletePermissionTemplate } from '@/api/account/permissionTemplates';
import { useFlashKey } from '@/plugins/useFlash';

export default ({ uuid, name }: { uuid: string; name: string }) => {
    const { clearAndAddHttpError } = useFlashKey('account:permission-templates');
    const [visible, setVisible] = useState(false);
    const removeTemplate = useStoreActions(
        (actions: Actions<ApplicationStore>) => actions.permissionTemplates.removeTemplate
    );

    const onConfirmed = () => {
        clearAndAddHttpError();
        deletePermissionTemplate(uuid)
            .then(() => removeTemplate(uuid))
            .catch((error) => clearAndAddHttpError(error));
    };

    return (
        <>
            <Dialog.Confirm
                open={visible}
                title={'Delete Permission Template'}
                confirm={'Delete Template'}
                onConfirmed={onConfirmed}
                onClose={() => setVisible(false)}
            >
                Removing the <Code>{name}</Code> template will not affect subusers it has already been applied to.
            </Dialog.Confirm>
            <button css={tw`ml-4 p-2 text-sm`} onClick={() => setVisible(true)} type={'button'}>
                <FontAwesomeIcon icon={faTrashAlt} css={tw`text-neutral-400 hover:text-red-400 transition-colors duration-150`} />
            </button>
        </>
    );
};
