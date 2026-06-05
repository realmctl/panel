import React from 'react';
import { Link } from 'react-router-dom';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';

export interface BreadcrumbItem {
    label: string;
    to?: string;
}

interface PageHeaderProps {
    title: string;
    children?: React.ReactNode;
    rightActions?: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, children, rightActions, breadcrumbs }) => {
    const email = useStoreState((state: ApplicationStore) => state.user.data!.email);
    const uuid = useStoreState((state: ApplicationStore) => state.user.data!.uuid);

    const supportId = uuid.split('-')[0].toUpperCase();

    return (
        <div className={'w-full bg-realm-card'}>
            <div className={'w-full max-w-[1200px] mx-4 xl:mx-auto pt-6' + (children ? ' pb-4' : ' pb-6')}>
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <nav className={'flex items-center gap-1.5 mb-2 text-xs text-neutral-500'} aria-label={'Breadcrumb'}>
                        {breadcrumbs.map((crumb, index) => (
                            <React.Fragment key={index}>
                                {index > 0 && <span className={'text-neutral-700'}>/</span>}
                                {crumb.to ? (
                                    <Link
                                        to={crumb.to}
                                        className={'text-neutral-500 hover:text-neutral-300 no-underline transition-colors duration-150'}
                                    >
                                        {crumb.label}
                                    </Link>
                                ) : (
                                    <span className={'text-neutral-400'}>{crumb.label}</span>
                                )}
                            </React.Fragment>
                        ))}
                    </nav>
                )}
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
