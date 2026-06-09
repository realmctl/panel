import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import AdminContent from '@/components/admin/AdminContent';
import GeneralSettingsPanel from '@/components/admin/settings/GeneralSettingsPanel';
import MailSettingsPanel from '@/components/admin/settings/MailSettingsPanel';
import SecuritySettingsPanel from '@/components/admin/settings/SecuritySettingsPanel';
import OAuthSettingsPanel from '@/components/admin/settings/OAuthSettingsPanel';
import MappingsSettingsPanel from '@/components/admin/settings/MappingsSettingsPanel';
import AdvancedSettingsPanel from '@/components/admin/settings/AdvancedSettingsPanel';
import { settingsTabs } from '@/components/admin/settings/settingsTabs';
import { adminBasePath } from '@/routers/adminRoutes';
import TabNav, { TabItem } from '@/components/admin/TabNav';
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

    const tabItems: TabItem[] = settingsTabs.map((tab) => ({
        id: tab.id,
        label: tab.label,
        to: `${adminBasePath}/settings${tab.path}`.replace('//', '/'),
        exact: tab.path === '',
    }));

    return (
        <AdminContent title={'Settings'} description={'Configure how your panel behaves.'}>
            <FlashMessageRender byKey={'admin-settings'} className={'mb-4'} />

            <TabNav items={tabItems} />

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
        </AdminContent>
    );
};
