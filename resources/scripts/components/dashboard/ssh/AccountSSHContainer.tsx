import React, { useEffect } from 'react';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import FlashMessageRender from '@/components/FlashMessageRender';
import PageContentBlock from '@/components/elements/PageContentBlock';
import { useSSHKeys } from '@/api/account/ssh-keys';
import { useFlashKey } from '@/plugins/useFlash';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey } from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';
import CreateSSHKeyForm from '@/components/dashboard/ssh/CreateSSHKeyForm';
import DeleteSSHKeyButton from '@/components/dashboard/ssh/DeleteSSHKeyButton';
import RealmCard from '@/components/elements/realm/RealmCard';

const cardHeaderClassName = '!py-2.5 !bg-realm-card !border-realm-border/50';

export default () => {
    const { clearAndAddHttpError } = useFlashKey('account');
    const { data, isValidating, error } = useSSHKeys({
        revalidateOnMount: true,
        revalidateOnFocus: false,
    });

    useEffect(() => {
        clearAndAddHttpError(error);
    }, [error]);

    return (
        <PageContentBlock title={'SSH Keys'}>
            <FlashMessageRender byKey={'account'} className={'mb-4'} />
            <div className={'grid grid-cols-1 lg:grid-cols-2 gap-4'}>
                <RealmCard
                    rounded={'md'}
                    border={'soft'}
                    header={<h2 className={'text-base font-semibold text-neutral-100 m-0'}>Add SSH Key</h2>}
                    headerClassName={cardHeaderClassName}
                >
                    <CreateSSHKeyForm />
                </RealmCard>

                <RealmCard
                    rounded={'md'}
                    border={'soft'}
                    header={<h2 className={'text-base font-semibold text-neutral-100 m-0'}>SSH Keys</h2>}
                    headerClassName={cardHeaderClassName}
                    className={'relative'}
                >
                    <SpinnerOverlay visible={!data && isValidating} />
                    {!data || !data.length ? (
                        <p className={'text-center text-sm text-neutral-400'}>
                            {!data ? 'Loading...' : 'No SSH Keys exist for this account.'}
                        </p>
                    ) : (
                        <div className={'space-y-2'}>
                            {data.map((key) => (
                                <div
                                    key={key.fingerprint}
                                    className={'flex items-center gap-3 p-3 rounded bg-realm-surface border border-realm-border'}
                                >
                                    <FontAwesomeIcon icon={faKey} className={'text-neutral-400 flex-shrink-0'} />
                                    <div className={'flex-1 overflow-hidden'}>
                                        <p className={'text-sm font-medium break-words'}>{key.name}</p>
                                        <p className={'text-xs mt-1 font-mono truncate text-neutral-400'}>
                                            SHA256:{key.fingerprint}
                                        </p>
                                        <p className={'text-xs mt-1 text-neutral-400 uppercase'}>
                                            Added on:&nbsp;
                                            {format(key.createdAt, 'MMM do, yyyy HH:mm')}
                                        </p>
                                    </div>
                                    <DeleteSSHKeyButton name={key.name} fingerprint={key.fingerprint} />
                                </div>
                            ))}
                        </div>
                    )}
                </RealmCard>
            </div>
        </PageContentBlock>
    );
};
