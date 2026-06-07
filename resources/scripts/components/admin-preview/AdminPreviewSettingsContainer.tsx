import React from 'react';
import { NavLink, Route, Switch, useRouteMatch } from 'react-router-dom';
import AdminPreviewContent from '@/components/admin-preview/AdminPreviewContent';
import GeneralSettingsPanel from '@/components/admin-preview/settings/GeneralSettingsPanel';
import MailSettingsPanel from '@/components/admin-preview/settings/MailSettingsPanel';
import SecuritySettingsPanel from '@/components/admin-preview/settings/SecuritySettingsPanel';
import OAuthSettingsPanel from '@/components/admin-preview/settings/OAuthSettingsPanel';
import MappingsSettingsPanel from '@/components/admin-preview/settings/MappingsSettingsPanel';
import AdvancedSettingsPanel from '@/components/admin-preview/settings/AdvancedSettingsPanel';
import { settingsTabs } from '@/components/admin-preview/settings/settingsTabs';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';
import { cn } from '@/lib/utils';
import FlashMessageRender from '@/components/FlashMessageRender';

const panelByTabId: Record<string, React.ComponentType> = {
    general: GeneralSettingsPanel,
    mail: MailSettingsPanel,
    security: SecuritySettingsPanel,
    oauth: OAuthSettingsPanel,
    mappings: MappingsSettingsPanel,
    advanced: AdvancedSettingsPanel,
};

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
                            activeClassName="bg-muted text-primary"
                        >
                            {tab.label}
                        </NavLink>
                    );
                })}
            </div>

            <Switch>
                {settingsTabs.map((tab) => {
                    const Panel = panelByTabId[tab.id];

                    return (
                        <Route key={tab.id} path={`${match.path}${tab.path}`} exact={tab.path === ''}>
                            <Panel />
                        </Route>
                    );
                })}
            </Switch>
        </AdminPreviewContent>
    );
};
