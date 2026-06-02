import * as React from 'react';
import UpdatePasswordForm from '@/components/dashboard/forms/UpdatePasswordForm';
import UpdateEmailAddressForm from '@/components/dashboard/forms/UpdateEmailAddressForm';
import ConfigureTwoFactorForm from '@/components/dashboard/forms/ConfigureTwoFactorForm';
import PageContentBlock from '@/components/elements/PageContentBlock';
import MessageBox from '@/components/MessageBox';
import { useLocation } from 'react-router-dom';
import FlashMessageRender from '@/components/FlashMessageRender';

const cardStyle = { backgroundColor: '#192024', border: '1px solid #2d3338' } as React.CSSProperties;
const cardHeaderStyle = { backgroundColor: '#0e1417', borderBottom: '1px solid #2d3338' } as React.CSSProperties;

export default () => {
    const { state } = useLocation<undefined | { twoFactorRedirect?: boolean }>();

    return (
        <PageContentBlock title={'Account Overview'}>
            {state?.twoFactorRedirect && (
                <MessageBox title={'2-Factor Required'} type={'error'}>
                    Your account must have two-factor authentication enabled in order to continue.
                </MessageBox>
            )}

            <div className={'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'} style={{ marginTop: state?.twoFactorRedirect ? '1rem' : '2.5rem' }}>
                {/* Update Password Card */}
                <div className={'rounded-lg overflow-hidden'} style={cardStyle}>
                    <div className={'px-4 py-3'} style={cardHeaderStyle}>
                        <h3 className={'text-sm font-semibold text-neutral-100'}>Update Password</h3>
                    </div>
                    <div className={'px-4 py-4'}>
                        <FlashMessageRender byKey={'account:password'} className={'mb-4'} />
                        <UpdatePasswordForm />
                    </div>
                </div>

                {/* Update Email Address Card */}
                <div className={'rounded-lg overflow-hidden'} style={cardStyle}>
                    <div className={'px-4 py-3'} style={cardHeaderStyle}>
                        <h3 className={'text-sm font-semibold text-neutral-100'}>Update Email Address</h3>
                    </div>
                    <div className={'px-4 py-4'}>
                        <FlashMessageRender byKey={'account:email'} className={'mb-4'} />
                        <UpdateEmailAddressForm />
                    </div>
                </div>

                {/* Two-Step Verification Card */}
                <div className={'rounded-lg overflow-hidden'} style={cardStyle}>
                    <div className={'px-4 py-3'} style={cardHeaderStyle}>
                        <h3 className={'text-sm font-semibold text-neutral-100'}>Two-Step Verification</h3>
                    </div>
                    <div className={'px-4 py-4'}>
                        <FlashMessageRender byKey={'account:totp'} className={'mb-4'} />
                        <ConfigureTwoFactorForm />
                    </div>
                </div>
            </div>
        </PageContentBlock>
    );
};
