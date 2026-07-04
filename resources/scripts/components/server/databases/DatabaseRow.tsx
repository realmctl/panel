import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import Modal from '@/components/elements/Modal';
import FlashMessageRender from '@/components/FlashMessageRender';
import { ServerContext } from '@/state/server';
import deleteServerDatabase from '@/api/server/databases/deleteServerDatabase';
import { httpErrorToHuman } from '@/api/http';
import RotatePasswordButton from '@/components/server/databases/RotatePasswordButton';
import Can from '@/components/elements/Can';
import { ServerDatabase } from '@/api/server/databases/getServerDatabases';
import useFlash from '@/plugins/useFlash';
import { Button } from '@/components/elements/button/index';
import Label from '@/components/elements/Label';
import Input from '@/components/elements/Input';
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
    const [confirmName, setConfirmName] = useState('');
    const [deleting, setDeleting] = useState(false);

    const updateDatabase = ServerContext.useStoreActions((actions) => actions.databases.updateDatabase);
    const removeDatabase = ServerContext.useStoreActions((actions) => actions.databases.removeDatabase);

    const jdbcConnectionString = `jdbc:mysql://${database.username}${
        database.password ? `:${encodeURIComponent(database.password)}` : ''
    }@${database.connectionString}/${database.name}`;

    const expectedNames = [database.name.split('_', 2)[1], database.name];
    const isConfirmValid = expectedNames.includes(confirmName);

    useEffect(() => {
        if (!visible) return;
        setConfirmName('');
        setDeleting(false);
    }, [visible]);

    const submit = () => {
        if (!isConfirmValid || deleting) return;

        clearFlashes();
        setDeleting(true);
        deleteServerDatabase(uuid, database.id)
            .then(() => {
                setVisible(false);
                setTimeout(() => removeDatabase(database.id), 150);
            })
            .catch((error) => {
                console.error(error);
                setDeleting(false);
                addError({ key: 'database:delete', message: httpErrorToHuman(error) });
            });
    };

    return (
        <>
            <Modal
                visible={visible}
                dismissable={!deleting}
                showSpinnerOverlay={deleting}
                onDismissed={() => setVisible(false)}
                title={'Confirm database deletion'}
                footer={
                    <>
                        <Button.Text size={Button.Sizes.Small} onClick={() => setVisible(false)} disabled={deleting}>
                            Cancel
                        </Button.Text>
                        <Button.Danger size={Button.Sizes.Small} onClick={submit} disabled={!isConfirmValid || deleting}>
                            {deleting ? 'Deleting…' : 'Delete Database'}
                        </Button.Danger>
                    </>
                }
            >
                <FlashMessageRender byKey={'database:delete'} className={'mb-4'} />
                <p className={'text-sm text-neutral-400'}>
                    Deleting a database is a permanent action, it cannot be undone. This will permanently delete the{' '}
                    <strong className={'text-neutral-200'}>{database.name}</strong> database and remove all associated
                    data.
                </p>
                <div className={'mt-5'}>
                    <Label>Confirm Database Name</Label>
                    <Input
                        type={'text'}
                        value={confirmName}
                        onChange={(e) => setConfirmName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                submit();
                            }
                        }}
                    />
                    <p className={'text-xs text-neutral-500 mt-1.5 mb-0'}>Enter the database name to confirm deletion.</p>
                </div>
            </Modal>
            <Modal
                visible={connectionVisible}
                onDismissed={() => setConnectionVisible(false)}
                title={'Database connection details'}
                footer={
                    <>
                        <Can action={'database.update'}>
                            <RotatePasswordButton databaseId={database.id} onUpdate={updateDatabase} />
                        </Can>
                        <Button.Text size={Button.Sizes.Small} onClick={() => setConnectionVisible(false)}>
                            Close
                        </Button.Text>
                    </>
                }
            >
                <FlashMessageRender byKey={'database-connection-modal'} className={'mb-4'} />
                <div>
                    <Label>Endpoint</Label>
                    <CopyOnClick text={database.connectionString}>
                        <Input type={'text'} readOnly value={database.connectionString} />
                    </CopyOnClick>
                </div>
                <div className={'mt-5'}>
                    <Label>Connections from</Label>
                    <Input type={'text'} readOnly value={database.allowConnectionsFrom} />
                </div>
                <div className={'mt-5'}>
                    <Label>Username</Label>
                    <CopyOnClick text={database.username}>
                        <Input type={'text'} readOnly value={database.username} />
                    </CopyOnClick>
                </div>
                <Can action={'database.view_password'}>
                    <div className={'mt-5'}>
                        <Label>Password</Label>
                        <CopyOnClick text={database.password} showInNotification={false}>
                            <Input type={'text'} readOnly value={database.password} />
                        </CopyOnClick>
                    </div>
                </Can>
                <div className={'mt-5'}>
                    <Label>JDBC Connection String</Label>
                    <CopyOnClick text={jdbcConnectionString} showInNotification={false}>
                        <Input type={'text'} readOnly value={jdbcConnectionString} />
                    </CopyOnClick>
                </div>
            </Modal>
            <div className={classNames('grid grid-cols-12 gap-4 items-center px-4 py-3', className)}>
                <div className={'col-span-4'}>
                    <CopyOnClick text={database.name}>
                        <p className={'text-sm font-mono text-neutral-200 m-0 truncate'}>{database.name}</p>
                    </CopyOnClick>
                </div>
                <div className={'col-span-3'}>
                    <CopyOnClick text={database.username}>
                        <span className={'text-xs text-neutral-400 font-mono truncate'}>{database.username}</span>
                    </CopyOnClick>
                </div>
                <div className={'col-span-3'}>
                    <CopyOnClick text={database.connectionString}>
                        <span className={'text-xs text-neutral-400 font-mono truncate'}>{database.connectionString}</span>
                    </CopyOnClick>
                </div>
                <div className={'col-span-2 flex items-center justify-end gap-1'}>
                    <button
                        onClick={() => setConnectionVisible(true)}
                        className={'flex items-center justify-center w-8 h-8 rounded-md text-neutral-400 hover:text-neutral-100 hover:bg-neutral-700/50 bg-transparent border-0 cursor-pointer transition-colors duration-150'}
                        title={'View details'}
                    >
                        <FontAwesomeIcon icon={faEye} size={'sm'} />
                    </button>
                    <Can action={'database.delete'}>
                        <button
                            onClick={() => setVisible(true)}
                            className={'flex items-center justify-center w-8 h-8 rounded-md text-neutral-400 hover:text-red-400 hover:bg-red-500/10 bg-transparent border-0 cursor-pointer transition-colors duration-150'}
                            title={'Delete database'}
                        >
                            <FontAwesomeIcon icon={faTrashAlt} size={'sm'} />
                        </button>
                    </Can>
                </div>
            </div>
        </>
    );
};
