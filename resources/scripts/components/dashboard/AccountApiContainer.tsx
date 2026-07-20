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
import RealmCard from '@/components/elements/realm/RealmCard';

const cardHeaderClassName = '!py-2.5 !bg-realm-card !border-realm-border/50';

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
            <FlashMessageRender byKey={'account'} className={'mb-4'} />
            <div className={'grid grid-cols-1 lg:grid-cols-2 gap-4'}>
                <RealmCard
                    rounded={'md'}
                    border={'soft'}
                    header={<h2 className={'text-base font-semibold text-neutral-100 m-0'}>Create API Key</h2>}
                    headerClassName={cardHeaderClassName}
                >
                    <CreateApiKeyForm onKeyCreated={(key) => setKeys((s) => [...s!, key])} />
                </RealmCard>

                <RealmCard
                    rounded={'md'}
                    border={'soft'}
                    header={<h2 className={'text-base font-semibold text-neutral-100 m-0'}>API Keys</h2>}
                    headerClassName={cardHeaderClassName}
                    className={'relative'}
                >
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
                                    className={'flex items-center gap-3 p-3 rounded bg-realm-surface border border-realm-border'}
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
                </RealmCard>
            </div>
        </PageContentBlock>
    );
};
