import React from 'react';
import classNames from 'classnames';

export const DetailGroup = ({ label }: { label: string }) => (
    <p className={'text-[0.65rem] font-semibold tracking-wide text-neutral-500 m-0'}>{label}</p>
);

export const DetailRow = ({
    icon: Icon,
    label,
    value,
    align = 'center',
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: React.ReactNode;
    align?: 'center' | 'start';
}) => (
    <div className={classNames('flex gap-3 text-sm', align === 'start' ? 'items-start' : 'items-center')}>
        <Icon className={'w-4 h-4 text-neutral-500 flex-shrink-0 mt-0.5'} />
        <span className={'text-neutral-400 flex-shrink-0 w-24'}>{label}</span>
        <span className={'text-neutral-200 text-right flex-1'}>{value}</span>
    </div>
);
