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

const cardStyle = { backgroundColor: '#192024', border: '1px solid #2d3338' } as React.CSSProperties;
const cardHeaderStyle = { backgroundColor: '#0e1417', borderBottom: '1px solid #2d3338' } as React.CSSProperties;
const rowStyle = { backgroundColor: '#0e1417', borderBottom: '1px solid #2d3338' } as React.CSSProperties;

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
            <FlashMessageRender byKey={'account'} />
            <div className={'grid grid-cols-1 lg:grid-cols-2 gap-4'} style={{ marginTop: '2.5rem' }}>
                {/* Add SSH Key Card */}
                <div className={'rounded-lg overflow-hidden'} style={cardStyle}>
                    <div className={'px-4 py-3'} style={cardHeaderStyle}>
                        <h3 className={'text-sm font-semibold text-neutral-100'}>Add SSH Key</h3>
                    </div>
                    <div className={'px-4 py-4'}>
                        <CreateSSHKeyForm />
                    </div>
                </div>

                {/* SSH Keys Card */}
                <div className={'rounded-lg overflow-hidden'} style={cardStyle}>
                    <div className={'px-4 py-3'} style={cardHeaderStyle}>
                        <h3 className={'text-sm font-semibold text-neutral-100'}>SSH Keys</h3>
                    </div>
                    <div className={'px-4 py-4'}>
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
                                        className={'flex items-center gap-3 p-3 rounded'}
                                        style={rowStyle}
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
                    </div>
                </div>
            </div>
        </PageContentBlock>
    );
};
