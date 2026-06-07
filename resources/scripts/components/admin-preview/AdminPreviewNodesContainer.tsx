import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import AdminPreviewContent from '@/components/admin-preview/AdminPreviewContent';
import NodeListPanel from '@/components/admin-preview/nodes/NodeListPanel';
import NodeCreatePanel from '@/components/admin-preview/nodes/NodeCreatePanel';
import AdminPreviewNodeViewContainer from '@/components/admin-preview/AdminPreviewNodeViewContainer';
import FlashMessageRender from '@/components/FlashMessageRender';

export default () => {
    const match = useRouteMatch();

    return (
        <AdminPreviewContent title={'Nodes'} description={'Manage Wings daemons and node capacity.'}>
            <FlashMessageRender byKey={'admin-nodes'} className={'mb-4'} />

            <Switch>
                <Route path={`${match.path}/new`}>
                    <NodeCreatePanel />
                </Route>
                <Route path={`${match.path}/:id`}>
                    <AdminPreviewNodeViewContainer />
                </Route>
                <Route path={match.path} exact>
                    <NodeListPanel />
                </Route>
            </Switch>
        </AdminPreviewContent>
    );
};
