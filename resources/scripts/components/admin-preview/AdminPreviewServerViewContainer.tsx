import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import ServerTabNav from '@/components/admin-preview/servers/ServerTabNav';
import ServerAboutPanel from '@/components/admin-preview/servers/ServerAboutPanel';
import ServerDetailsPanel from '@/components/admin-preview/servers/ServerDetailsPanel';
import ServerBuildPanel from '@/components/admin-preview/servers/ServerBuildPanel';
import ServerStartupPanel from '@/components/admin-preview/servers/ServerStartupPanel';
import ServerDatabasePanel from '@/components/admin-preview/servers/ServerDatabasePanel';
import ServerMountsPanel from '@/components/admin-preview/servers/ServerMountsPanel';
import ServerManagePanel from '@/components/admin-preview/servers/ServerManagePanel';
import ServerDeletePanel from '@/components/admin-preview/servers/ServerDeletePanel';

export default () => {
    const match = useRouteMatch();

    return (
        <>
            <ServerTabNav />

            <Switch>
                <Route path={`${match.path}/details`}>
                    <ServerDetailsPanel />
                </Route>
                <Route path={`${match.path}/build`}>
                    <ServerBuildPanel />
                </Route>
                <Route path={`${match.path}/startup`}>
                    <ServerStartupPanel />
                </Route>
                <Route path={`${match.path}/database`}>
                    <ServerDatabasePanel />
                </Route>
                <Route path={`${match.path}/mounts`}>
                    <ServerMountsPanel />
                </Route>
                <Route path={`${match.path}/manage`}>
                    <ServerManagePanel />
                </Route>
                <Route path={`${match.path}/delete`}>
                    <ServerDeletePanel />
                </Route>
                <Route path={match.path} exact>
                    <ServerAboutPanel />
                </Route>
            </Switch>
        </>
    );
};
