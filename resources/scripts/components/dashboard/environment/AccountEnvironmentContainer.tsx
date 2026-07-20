import React, { useState } from 'react';
import classNames from 'classnames';
import PageContentBlock from '@/components/elements/PageContentBlock';
import PermissionTemplatesPanel from '@/components/dashboard/permissionTemplates/PermissionTemplatesPanel';
import { realmClasses } from '@/lib/realmTokens';

type Tab = 'templates';

// Add more entries here as additional global environment settings are introduced.
const TABS: { id: Tab; label: string }[] = [{ id: 'templates', label: 'Permission Templates' }];

export default () => {
    const [activeTab, setActiveTab] = useState<Tab>('templates');

    return (
        <PageContentBlock title={'Environment'}>
            <div className={'grid grid-cols-1 lg:grid-cols-[13rem_1fr] gap-6'}>
                <div
                    className={classNames(
                        'flex lg:flex-col gap-1 p-1 rounded-md flex-shrink-0 lg:self-start overflow-x-auto',
                        realmClasses.tabBar
                    )}
                >
                    {TABS.map((tab) => {
                        const active = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                type={'button'}
                                onClick={() => setActiveTab(tab.id)}
                                className={classNames(
                                    'flex-1 lg:flex-none text-left px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 whitespace-nowrap border-0 cursor-pointer',
                                    active ? realmClasses.tabActive : realmClasses.tabInactive
                                )}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className={'min-w-0'}>{activeTab === 'templates' && <PermissionTemplatesPanel />}</div>
            </div>
        </PageContentBlock>
    );
};
