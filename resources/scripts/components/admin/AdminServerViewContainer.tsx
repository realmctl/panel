import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import ServerTabNav from '@/components/admin/servers/ServerTabNav';
import ServerAboutPanel from '@/components/admin/servers/ServerAboutPanel';
import ServerDetailsPanel from '@/components/admin/servers/ServerDetailsPanel';
import ServerBuildPanel from '@/components/admin/servers/ServerBuildPanel';
import ServerStartupPanel from '@/components/admin/servers/ServerStartupPanel';
import ServerDatabasePanel from '@/components/admin/servers/ServerDatabasePanel';
import ServerMountsPanel from '@/components/admin/servers/ServerMountsPanel';
import ServerManagePanel from '@/components/admin/servers/ServerManagePanel';
import ServerDeletePanel from '@/components/admin/servers/ServerDeletePanel';

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
