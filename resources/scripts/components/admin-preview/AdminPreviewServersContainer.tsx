import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import AdminPreviewContent from '@/components/admin-preview/AdminPreviewContent';
import ServerListPanel from '@/components/admin-preview/servers/ServerListPanel';
import ServerCreatePanel from '@/components/admin-preview/servers/ServerCreatePanel';
import AdminPreviewServerViewContainer from '@/components/admin-preview/AdminPreviewServerViewContainer';
import FlashMessageRender from '@/components/FlashMessageRender';

export default () => {
    const match = useRouteMatch();

    return (
        <AdminPreviewContent title={'Servers'} description={'Browse and manage servers on your panel.'}>
            <FlashMessageRender byKey={'admin-servers'} className={'mb-4'} />

            <Switch>
                <Route path={`${match.path}/new`}>
                    <ServerCreatePanel />
                </Route>
                <Route path={`${match.path}/:id`}>
                    <AdminPreviewServerViewContainer />
                </Route>
                <Route path={match.path} exact>
                    <ServerListPanel />
                </Route>
            </Switch>
        </AdminPreviewContent>
    );
};
