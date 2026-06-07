import React from 'react';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';
import AdminPreviewContent from '@/components/admin-preview/AdminPreviewContent';
import LocationListPanel from '@/components/admin-preview/locations/LocationListPanel';
import LocationViewPanel from '@/components/admin-preview/locations/LocationViewPanel';
import FlashMessageRender from '@/components/FlashMessageRender';

export default () => {
    const match = useRouteMatch();

    return (
        <AdminPreviewContent title={'Locations'} description={'Manage geographic and logical node groupings.'}>
            <FlashMessageRender byKey={'admin-locations'} className={'mb-4'} />

            <Switch>
                <Route path={`${match.path}/new`}>
                    <Redirect to={match.path} />
                </Route>
                <Route path={`${match.path}/:id`}>
                    <LocationViewPanel />
                </Route>
                <Route path={match.path} exact>
                    <LocationListPanel />
                </Route>
            </Switch>
        </AdminPreviewContent>
    );
};
