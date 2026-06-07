import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import NodeTabNav from '@/components/admin-preview/nodes/NodeTabNav';
import NodeAboutPanel from '@/components/admin-preview/nodes/NodeAboutPanel';
import NodeSettingsPanel from '@/components/admin-preview/nodes/NodeSettingsPanel';
import NodeConfigurationPanel from '@/components/admin-preview/nodes/NodeConfigurationPanel';
import NodeAllocationPanel from '@/components/admin-preview/nodes/NodeAllocationPanel';
import NodeServersPanel from '@/components/admin-preview/nodes/NodeServersPanel';

export default () => {
    const match = useRouteMatch();

    return (
        <>
            <NodeTabNav />

            <Switch>
                <Route path={`${match.path}/settings`}>
                    <NodeSettingsPanel />
                </Route>
                <Route path={`${match.path}/configuration`}>
                    <NodeConfigurationPanel />
                </Route>
                <Route path={`${match.path}/allocation`}>
                    <NodeAllocationPanel />
                </Route>
                <Route path={`${match.path}/servers`}>
                    <NodeServersPanel />
                </Route>
                <Route path={match.path} exact>
                    <NodeAboutPanel />
                </Route>
            </Switch>
        </>
    );
};
