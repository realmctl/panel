import React from 'react';
import classNames from 'classnames';
import { realmClasses } from '@/lib/realmTokens';

interface RealmCardSourceHeaderProps {
    label: string;
    description: string;
    icon?: string;
    iconAlt?: string;
    iconNode?: React.ReactNode;
    badge?: string;
}

export default ({ label, description, icon, iconAlt, iconNode, badge }: RealmCardSourceHeaderProps) => (
    <div className={'flex items-center gap-3 flex-wrap'}>
        {iconNode ??
            (icon ? <img src={icon} alt={iconAlt ?? label} className={'w-4 h-4 object-contain flex-shrink-0'} /> : null)}
        <span className={'text-xs uppercase tracking-wide text-neutral-400'}>{label}</span>
        <span className={'text-neutral-600 text-xs'}>—</span>
        <span className={'text-xs text-neutral-500'}>{description}</span>
        {badge && (
            <span className={classNames('ml-auto text-xs px-2 py-0.5 rounded-full font-mono', realmClasses.badge)}>
                {badge}
            </span>
        )}
    </div>
);
