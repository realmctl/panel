import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import AdminContent from '@/components/admin/AdminContent';
import DatabaseHostListPanel from '@/components/admin/databases/DatabaseHostListPanel';
import DatabaseHostCreatePanel from '@/components/admin/databases/DatabaseHostCreatePanel';
import DatabaseHostViewPanel from '@/components/admin/databases/DatabaseHostViewPanel';
import FlashMessageRender from '@/components/FlashMessageRender';

export default () => {
    const match = useRouteMatch();

    return (
        <AdminContent title={'Database Hosts'} description={'Manage MySQL hosts for server databases.'}>
            <FlashMessageRender byKey={'admin-databases'} className={'mb-4'} />

            <Switch>
                <Route path={`${match.path}/new`}>
                    <DatabaseHostCreatePanel />
                </Route>
                <Route path={`${match.path}/:id`}>
                    <DatabaseHostViewPanel />
                </Route>
                <Route path={match.path} exact>
                    <DatabaseHostListPanel />
                </Route>
            </Switch>
        </AdminContent>
    );
};
