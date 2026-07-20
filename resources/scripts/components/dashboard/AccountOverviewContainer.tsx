import * as React from 'react';
import UpdatePasswordForm from '@/components/dashboard/forms/UpdatePasswordForm';
import UpdateEmailAddressForm from '@/components/dashboard/forms/UpdateEmailAddressForm';
import ConfigureTwoFactorForm from '@/components/dashboard/forms/ConfigureTwoFactorForm';
import PageContentBlock from '@/components/elements/PageContentBlock';
import MessageBox from '@/components/MessageBox';
import { useLocation } from 'react-router-dom';
import FlashMessageRender from '@/components/FlashMessageRender';
import RealmCard from '@/components/elements/realm/RealmCard';

const cardHeaderClassName = '!py-2.5 !bg-realm-card !border-realm-border/50';

export default () => {
    const { state } = useLocation<undefined | { twoFactorRedirect?: boolean }>();

    return (
        <PageContentBlock title={'Account Overview'}>
            {state?.twoFactorRedirect && (
                <div className={'mb-4'}>
                    <MessageBox title={'2-Factor Required'} type={'error'}>
                        Your account must have two-factor authentication enabled in order to continue.
                    </MessageBox>
                </div>
            )}

            <div className={'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}>
                <RealmCard
                    rounded={'md'}
                    border={'soft'}
                    header={<h2 className={'text-base font-semibold text-neutral-100 m-0'}>Update Password</h2>}
                    headerClassName={cardHeaderClassName}
                >
                    <FlashMessageRender byKey={'account:password'} className={'mb-4'} />
                    <UpdatePasswordForm />
                </RealmCard>

                <RealmCard
                    rounded={'md'}
                    border={'soft'}
                    header={<h2 className={'text-base font-semibold text-neutral-100 m-0'}>Update Email Address</h2>}
                    headerClassName={cardHeaderClassName}
                >
                    <FlashMessageRender byKey={'account:email'} className={'mb-4'} />
                    <UpdateEmailAddressForm />
                </RealmCard>

                <RealmCard
                    rounded={'md'}
                    border={'soft'}
                    header={<h2 className={'text-base font-semibold text-neutral-100 m-0'}>Two-Step Verification</h2>}
                    headerClassName={cardHeaderClassName}
                >
                    <FlashMessageRender byKey={'account:totp'} className={'mb-4'} />
                    <ConfigureTwoFactorForm />
                </RealmCard>
            </div>
        </PageContentBlock>
    );
};
