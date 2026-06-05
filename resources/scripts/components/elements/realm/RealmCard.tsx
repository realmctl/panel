import React from 'react';
import classNames from 'classnames';
import { realmClasses } from '@/lib/realmTokens';

interface RealmCardProps {
    children: React.ReactNode;
    className?: string;
    bodyClassName?: string;
    header?: React.ReactNode;
    headerClassName?: string;
    title?: string;
    rounded?: 'md' | 'lg';
    border?: 'solid' | 'soft';
}

export default ({
    children,
    className,
    bodyClassName,
    header,
    headerClassName,
    title,
    rounded = 'lg',
    border = 'solid',
}: RealmCardProps) => (
    <div
        className={classNames(
            'overflow-hidden bg-realm-card',
            border === 'soft' ? 'border border-realm-border/50' : 'border border-realm-border',
            rounded === 'lg' ? 'rounded-lg' : 'rounded-md',
            className
        )}
    >
        {header && (
            <div className={classNames('px-4 py-3', realmClasses.cardHeader, headerClassName)}>{header}</div>
        )}
        <div className={classNames(header ? 'px-4 py-4' : title ? 'p-5' : 'p-4', bodyClassName)}>
            {title && (
                <>
                    <h2 className={'text-lg font-semibold text-neutral-100 m-0 mb-4'}>{title}</h2>
                    <div className={'border-t border-realm-border/50 mb-4'} />
                </>
            )}
            {children}
        </div>
    </div>
);
