import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import AdminPreviewContent from '@/components/admin-preview/AdminPreviewContent';
import MountListPanel from '@/components/admin-preview/mounts/MountListPanel';
import MountViewPanel from '@/components/admin-preview/mounts/MountViewPanel';
import FlashMessageRender from '@/components/FlashMessageRender';

export default () => {
    const match = useRouteMatch();

    return (
        <AdminPreviewContent title={'Mounts'} description={'Manage host path mounts for server containers.'}>
            <FlashMessageRender byKey={'admin-mounts'} className={'mb-4'} />
            <Switch>
                <Route path={`${match.path}/:id`}>
                    <MountViewPanel />
                </Route>
                <Route path={match.path} exact>
                    <MountListPanel />
                </Route>
            </Switch>
        </AdminPreviewContent>
    );
};
