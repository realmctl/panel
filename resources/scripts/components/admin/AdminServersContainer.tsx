import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import AdminContent from '@/components/admin/AdminContent';
import ServerListPanel from '@/components/admin/servers/ServerListPanel';
import ServerCreatePanel from '@/components/admin/servers/ServerCreatePanel';
import AdminServerViewContainer from '@/components/admin/AdminServerViewContainer';
import FlashMessageRender from '@/components/FlashMessageRender';

export default () => {
    const match = useRouteMatch();

    return (
        <AdminContent title={'Servers'} description={'Browse and manage servers on your panel.'}>
            <FlashMessageRender byKey={'admin-servers'} className={'mb-4'} />

            <Switch>
                <Route path={`${match.path}/new`}>
                    <ServerCreatePanel />
                </Route>
                <Route path={`${match.path}/:id`}>
                    <AdminServerViewContainer />
                </Route>
                <Route path={match.path} exact>
                    <ServerListPanel />
                </Route>
            </Switch>
        </AdminContent>
    );
};
