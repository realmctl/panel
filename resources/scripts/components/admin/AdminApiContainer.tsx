import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import AdminContent from '@/components/admin/AdminContent';
import ApplicationApiListPanel from '@/components/admin/api/ApplicationApiListPanel';
import ApplicationApiCreatePanel from '@/components/admin/api/ApplicationApiCreatePanel';
import FlashMessageRender from '@/components/FlashMessageRender';

export default () => {
    const match = useRouteMatch();

    return (
        <AdminContent
            title={'Application API'}
            description={'Manage application API credentials and permissions.'}
        >
            <FlashMessageRender byKey={'admin-api'} className={'mb-4'} />

            <Switch>
                <Route path={`${match.path}/new`}>
                    <ApplicationApiCreatePanel />
                </Route>
                <Route path={match.path} exact>
                    <ApplicationApiListPanel />
                </Route>
            </Switch>
        </AdminContent>
    );
};
