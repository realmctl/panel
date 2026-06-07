import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import AdminPreviewContent from '@/components/admin-preview/AdminPreviewContent';
import ApplicationApiListPanel from '@/components/admin-preview/api/ApplicationApiListPanel';
import ApplicationApiCreatePanel from '@/components/admin-preview/api/ApplicationApiCreatePanel';
import FlashMessageRender from '@/components/FlashMessageRender';

export default () => {
    const match = useRouteMatch();

    return (
        <AdminPreviewContent
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
        </AdminPreviewContent>
    );
};
