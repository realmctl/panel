import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import AdminPreviewContent from '@/components/admin-preview/AdminPreviewContent';
import GeneralSettingsPanel from '@/components/admin-preview/settings/GeneralSettingsPanel';
import MailSettingsPanel from '@/components/admin-preview/settings/MailSettingsPanel';
import SecuritySettingsPanel from '@/components/admin-preview/settings/SecuritySettingsPanel';
import OAuthSettingsPanel from '@/components/admin-preview/settings/OAuthSettingsPanel';
import MappingsSettingsPanel from '@/components/admin-preview/settings/MappingsSettingsPanel';
import AdvancedSettingsPanel from '@/components/admin-preview/settings/AdvancedSettingsPanel';
import { settingsTabs } from '@/components/admin-preview/settings/settingsTabs';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';
import TabNav, { TabItem } from '@/components/admin-preview/TabNav';
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
        to: `${adminPreviewBasePath}/settings${tab.path}`.replace('//', '/'),
        exact: tab.path === '',
    }));

    return (
        <AdminPreviewContent title={'Settings'} description={'Configure how your panel behaves.'}>
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
        </AdminPreviewContent>
    );
};
