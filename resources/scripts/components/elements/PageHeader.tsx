import React from 'react';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';

interface PageHeaderProps {
    title: string;
    children?: React.ReactNode;
    rightActions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, children, rightActions }) => {
    const email = useStoreState((state: ApplicationStore) => state.user.data!.email);
    const uuid = useStoreState((state: ApplicationStore) => state.user.data!.uuid);

    // Use first 8 chars of UUID as a support ID
    const supportId = uuid.split('-')[0].toUpperCase();

    return (
        <div className={'w-full'} style={{ backgroundColor: '#192024' }}>
            <div className={'w-full max-w-[1200px] mx-4 xl:mx-auto pt-6' + (children ? ' pb-4' : ' pb-6')}>
                <div className={'flex items-center justify-between'}>
                    <div>
                        <h1 className={'text-2xl font-header font-semibold text-neutral-100'}>
                            {title}
                        </h1>
                        <div className={'flex items-center gap-4 mt-1'}>
                            <span className={'text-sm text-neutral-400'}>
                                {email}
                            </span>
                            <span className={'text-neutral-600'}>•</span>
                            <span className={'text-sm text-neutral-400'}>
                                Support ID: <span className={'text-neutral-300 font-mono'}>{supportId}</span>
                            </span>
                        </div>
                    </div>
                    {rightActions && (
                        <div className={'flex items-center'}>
                            {rightActions}
                        </div>
                    )}
                </div>
            </div>
            {children}
        </div>
    );
};

export default PageHeader;
