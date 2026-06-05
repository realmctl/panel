import React from 'react';
import classNames from 'classnames';
import { realmClasses } from '@/lib/realmTokens';

export interface RealmTab<T extends string = string> {
    id: T;
    label: string;
}

interface RealmTabBarProps<T extends string> {
    tabs: RealmTab<T>[];
    activeTab: T;
    onTabChange: (tab: T) => void;
    className?: string;
}

export default <T extends string>({ tabs, activeTab, onTabChange, className }: RealmTabBarProps<T>) => (
    <div
        className={classNames(
            'flex items-center gap-1 p-1 rounded-lg w-fit max-w-full overflow-x-auto',
            realmClasses.tabBar,
            className
        )}
    >
        {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
                <button
                    key={tab.id}
                    type={'button'}
                    onClick={() => onTabChange(tab.id)}
                    className={classNames(
                        'px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 whitespace-nowrap border-0 cursor-pointer',
                        isActive ? realmClasses.tabActive : realmClasses.tabInactive
                    )}
                >
                    {tab.label}
                </button>
            );
        })}
    </div>
);
