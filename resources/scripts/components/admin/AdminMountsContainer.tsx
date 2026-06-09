import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import AdminContent from '@/components/admin/AdminContent';
import MountListPanel from '@/components/admin/mounts/MountListPanel';
import MountViewPanel from '@/components/admin/mounts/MountViewPanel';
import FlashMessageRender from '@/components/FlashMessageRender';

export default () => {
    const match = useRouteMatch();

    return (
        <AdminContent title={'Mounts'} description={'Manage host path mounts for server containers.'}>
            <FlashMessageRender byKey={'admin-mounts'} className={'mb-4'} />
            <Switch>
                <Route path={`${match.path}/:id`}>
                    <MountViewPanel />
                </Route>
                <Route path={match.path} exact>
                    <MountListPanel />
                </Route>
            </Switch>
        </AdminContent>
    );
};
