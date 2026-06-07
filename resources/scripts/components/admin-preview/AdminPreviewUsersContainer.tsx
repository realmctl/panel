import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import AdminPreviewContent from '@/components/admin-preview/AdminPreviewContent';
import UserListPanel from '@/components/admin-preview/users/UserListPanel';
import UserCreatePanel from '@/components/admin-preview/users/UserCreatePanel';
import UserViewPanel from '@/components/admin-preview/users/UserViewPanel';
import FlashMessageRender from '@/components/FlashMessageRender';

export default () => {
    const match = useRouteMatch();

    return (
        <AdminPreviewContent title={'Users'} description={'Manage panel user accounts and permissions.'}>
            <FlashMessageRender byKey={'admin-users'} className={'mb-4'} />

            <Switch>
                <Route path={`${match.path}/new`}>
                    <UserCreatePanel />
                </Route>
                <Route path={`${match.path}/:id`}>
                    <UserViewPanel />
                </Route>
                <Route path={match.path} exact>
                    <UserListPanel />
                </Route>
            </Switch>
        </AdminPreviewContent>
    );
};
