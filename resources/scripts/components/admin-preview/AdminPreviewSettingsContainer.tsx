import React from 'react';
import { NavLink, Route, Switch, useRouteMatch } from 'react-router-dom';
import AdminPreviewContent from '@/components/admin-preview/AdminPreviewContent';
import GeneralSettingsPanel from '@/components/admin-preview/settings/GeneralSettingsPanel';
import SettingsLegacyPanel from '@/components/admin-preview/settings/SettingsLegacyPanel';
import { settingsTabs } from '@/components/admin-preview/settings/settingsTabs';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';
import { cn } from '@/lib/utils';
import FlashMessageRender from '@/components/FlashMessageRender';

export default () => {
    const match = useRouteMatch();

    return (
        <AdminPreviewContent title={'Settings'} description={'Configure how your panel behaves.'}>
            <FlashMessageRender byKey={'admin-settings'} className={'mb-4'} />

            <div className="mb-6 flex flex-wrap gap-1 border-b border-border pb-1">
                {settingsTabs.map((tab) => {
                    const to = `${adminPreviewBasePath}/settings${tab.path}`.replace('//', '/');

                    return (
                        <NavLink
                            key={tab.id}
                            to={to}
                            exact={tab.path === ''}
                            className={cn(
                                'rounded-md px-3 py-2 text-sm no-underline transition-colors',
                                'text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                            activeClassName="bg-muted text-blue-500"
                        >
                            {tab.label}
                        </NavLink>
                    );
                })}
            </div>

            <Switch>
                {settingsTabs
                    .filter((tab) => tab.id !== 'general')
                    .map((tab) => (
                        <Route key={tab.id} path={`${match.path}${tab.path}`}>
                            <SettingsLegacyPanel tab={tab} />
                        </Route>
                    ))}
                <Route path={match.path} exact>
                    <GeneralSettingsPanel />
                </Route>
            </Switch>
        </AdminPreviewContent>
    );
};
