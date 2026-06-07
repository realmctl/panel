import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import AdminPreviewContent from '@/components/admin-preview/AdminPreviewContent';
import DatabaseHostListPanel from '@/components/admin-preview/databases/DatabaseHostListPanel';
import DatabaseHostCreatePanel from '@/components/admin-preview/databases/DatabaseHostCreatePanel';
import DatabaseHostViewPanel from '@/components/admin-preview/databases/DatabaseHostViewPanel';
import FlashMessageRender from '@/components/FlashMessageRender';

export default () => {
    const match = useRouteMatch();

    return (
        <AdminPreviewContent title={'Database Hosts'} description={'Manage MySQL hosts for server databases.'}>
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
        </AdminPreviewContent>
    );
};
