import React, { useState } from 'react';
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import tw from 'twin.macro';
import Icon from '@/components/elements/Icon';
import { ServerContext } from '@/state/server';
import { useFlashKey } from '@/plugins/useFlash';
import { Dialog } from '@/components/elements/dialog';
import { Button } from '@/components/elements/button/index';
import deleteSubdomain from '@/api/server/network/subdomains/deleteSubdomain';
import getSubdomains from '@/api/server/network/subdomains/getSubdomains';

interface Props {
    subdomainId: number;
    fqdn: string;
}

const DeleteSubdomainButton = ({ subdomainId, fqdn }: Props) => {
    const [confirm, setConfirm] = useState(false);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { clearFlashes, clearAndAddHttpError } = useFlashKey('server:network');
    const { mutate } = getSubdomains();

    const onDelete = () => {
        clearFlashes();
        setConfirm(false);

        mutate(
            (data) =>
                data
                    ? {
                          ...data,
                          domains: {
                              ...data.domains,
                              data: data.domains.data.filter((s) => s.id !== subdomainId),
                              total: Math.max(0, data.domains.total - 1),
                          },
                      }
                    : data,
            false
        );

        deleteSubdomain(uuid, subdomainId).catch((error) => {
            clearAndAddHttpError(error);
            mutate();
        });
    };

    return (
        <>
            <Dialog.Confirm
                open={confirm}
                onClose={() => setConfirm(false)}
                title={'Remove Subdomain'}
                confirm={'Delete'}
                onConfirmed={onDelete}
            >
                This will permanently remove <strong>{fqdn}</strong> from your DNS provider.
            </Dialog.Confirm>
            <Button.Danger
                variant={Button.Variants.Secondary}
                size={Button.Sizes.Small}
                shape={Button.Shapes.IconSquare}
                type={'button'}
                onClick={() => setConfirm(true)}
            >
                <Icon icon={faTrashAlt} css={tw`w-3 h-auto`} />
            </Button.Danger>
        </>
    );
};

export default DeleteSubdomainButton;
