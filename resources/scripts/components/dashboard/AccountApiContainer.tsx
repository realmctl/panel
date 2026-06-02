import React, { useEffect, useState } from 'react';
import CreateApiKeyForm from '@/components/dashboard/forms/CreateApiKeyForm';
import getApiKeys, { ApiKey } from '@/api/account/getApiKeys';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import deleteApiKey from '@/api/account/deleteApiKey';
import FlashMessageRender from '@/components/FlashMessageRender';
import { format } from 'date-fns';
import PageContentBlock from '@/components/elements/PageContentBlock';
import { Dialog } from '@/components/elements/dialog';
import { useFlashKey } from '@/plugins/useFlash';
import Code from '@/components/elements/Code';

const cardStyle = { backgroundColor: '#192024', border: '1px solid #2d3338' } as React.CSSProperties;
const cardHeaderStyle = { backgroundColor: '#0e1417', borderBottom: '1px solid #2d3338' } as React.CSSProperties;
const rowStyle = { backgroundColor: '#0e1417', borderBottom: '1px solid #2d3338' } as React.CSSProperties;

export default () => {
    const [deleteIdentifier, setDeleteIdentifier] = useState('');
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const { clearAndAddHttpError } = useFlashKey('account');

    useEffect(() => {
        getApiKeys()
            .then((keys) => setKeys(keys))
            .then(() => setLoading(false))
            .catch((error) => clearAndAddHttpError(error));
    }, []);

    const doDeletion = (identifier: string) => {
        setLoading(true);

        clearAndAddHttpError();
        deleteApiKey(identifier)
            .then(() => setKeys((s) => [...(s || []).filter((key) => key.identifier !== identifier)]))
            .catch((error) => clearAndAddHttpError(error))
            .then(() => {
                setLoading(false);
                setDeleteIdentifier('');
            });
    };

    return (
        <PageContentBlock title={'Account API'}>
            <FlashMessageRender byKey={'account'} />
            <div className={'grid grid-cols-1 lg:grid-cols-2 gap-4'} style={{ marginTop: '2.5rem' }}>
                {/* Create API Key Card */}
                <div className={'rounded-lg overflow-hidden'} style={cardStyle}>
                    <div className={'px-4 py-3'} style={cardHeaderStyle}>
                        <h3 className={'text-sm font-semibold text-neutral-100'}>Create API Key</h3>
                    </div>
                    <div className={'px-4 py-4'}>
                        <CreateApiKeyForm onKeyCreated={(key) => setKeys((s) => [...s!, key])} />
                    </div>
                </div>

                {/* API Keys Card */}
                <div className={'rounded-lg overflow-hidden'} style={cardStyle}>
                    <div className={'px-4 py-3'} style={cardHeaderStyle}>
                        <h3 className={'text-sm font-semibold text-neutral-100'}>API Keys</h3>
                    </div>
                    <div className={'px-4 py-4'}>
                        <SpinnerOverlay visible={loading} />
                        <Dialog.Confirm
                            title={'Delete API Key'}
                            confirm={'Delete Key'}
                            open={!!deleteIdentifier}
                            onClose={() => setDeleteIdentifier('')}
                            onConfirmed={() => doDeletion(deleteIdentifier)}
                        >
                            All requests using the <Code>{deleteIdentifier}</Code> key will be invalidated.
                        </Dialog.Confirm>
                        {keys.length === 0 ? (
                            <p className={'text-center text-sm text-neutral-400'}>
                                {loading ? 'Loading...' : 'No API keys exist for this account.'}
                            </p>
                        ) : (
                            <div className={'space-y-2'}>
                                {keys.map((key) => (
                                    <div
                                        key={key.identifier}
                                        className={'flex items-center gap-3 p-3 rounded'}
                                        style={rowStyle}
                                    >
                                        <FontAwesomeIcon icon={faKey} className={'text-neutral-400'} />
                                        <div className={'flex-1 overflow-hidden'}>
                                            <p className={'text-sm break-words'}>{key.description}</p>
                                            <p className={'text-xs text-neutral-400 uppercase mt-1'}>
                                                Last used:&nbsp;
                                                {key.lastUsedAt ? format(key.lastUsedAt, 'MMM do, yyyy HH:mm') : 'Never'}
                                            </p>
                                        </div>
                                        <p className={'text-xs ml-4 hidden md:block font-mono'}>
                                            {key.identifier}
                                        </p>
                                        <button
                                            className={'p-2 text-sm hover:text-red-400 transition-colors'}
                                            onClick={() => setDeleteIdentifier(key.identifier)}
                                        >
                                            <FontAwesomeIcon icon={faTrashAlt} className={'text-neutral-400'} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageContentBlock>
    );
};
