import React, { useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import reinstallServer from '@/api/server/reinstallServer';
import { Actions, useStoreActions } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { httpErrorToHuman } from '@/api/http';
import { Button } from '@/components/elements/button/index';
import Modal from '@/components/elements/Modal';

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const { addFlash, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const reinstall = () => {
        setLoading(true);
        clearFlashes('settings');
        reinstallServer(uuid)
            .then(() => {
                addFlash({
                    key: 'settings',
                    type: 'success',
                    message: 'Your server has begun the reinstallation process.',
                });
            })
            .catch((error) => {
                console.error(error);
                addFlash({ key: 'settings', type: 'error', message: httpErrorToHuman(error) });
            })
            .then(() => {
                setLoading(false);
                setModalVisible(false);
            });
    };

    useEffect(() => {
        clearFlashes();
    }, []);

    return (
        <>
            <Modal
                visible={modalVisible}
                onDismissed={() => setModalVisible(false)}
                dismissable={!loading}
                closeOnBackground={!loading}
                closeOnEscape={!loading}
                showSpinnerOverlay={loading}
                title={'Confirm server reinstallation'}
                footer={
                    <>
                        <Button.Text
                            size={Button.Sizes.Small}
                            onClick={() => setModalVisible(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button.Text>
                        <Button.Danger size={Button.Sizes.Small} onClick={reinstall} disabled={loading}>
                            Yes, reinstall server
                        </Button.Danger>
                    </>
                }
            >
                Your server will be stopped and some files may be deleted or modified during this process, are you sure
                you wish to continue?
            </Modal>

            <p className={'text-sm text-neutral-300 mb-6'}>
                Reinstalling your server will stop it, and then re-run the installation script that initially set it
                up.&nbsp;
                <strong className={'font-medium text-red-400'}>
                    Some files may be deleted or modified during this process, please back up your data before
                    continuing.
                </strong>
            </p>
            <div className={'flex justify-end'}>
                <Button.Danger onClick={() => setModalVisible(true)}>Reinstall Server</Button.Danger>
            </div>
        </>
    );
};
