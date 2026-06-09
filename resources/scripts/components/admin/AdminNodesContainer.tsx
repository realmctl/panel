import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import AdminContent from '@/components/admin/AdminContent';
import NodeListPanel from '@/components/admin/nodes/NodeListPanel';
import NodeCreatePanel from '@/components/admin/nodes/NodeCreatePanel';
import AdminNodeViewContainer from '@/components/admin/AdminNodeViewContainer';
import FlashMessageRender from '@/components/FlashMessageRender';

export default () => {
    const match = useRouteMatch();

    return (
        <AdminContent title={'Nodes'} description={'Manage Wings daemons and node capacity.'}>
            <FlashMessageRender byKey={'admin-nodes'} className={'mb-4'} />

            <Switch>
                <Route path={`${match.path}/new`}>
                    <NodeCreatePanel />
                </Route>
                <Route path={`${match.path}/:id`}>
                    <AdminNodeViewContainer />
                </Route>
                <Route path={match.path} exact>
                    <NodeListPanel />
                </Route>
            </Switch>
        </AdminContent>
    );
};
