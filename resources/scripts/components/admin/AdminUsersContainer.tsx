import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import AdminContent from '@/components/admin/AdminContent';
import UserListPanel from '@/components/admin/users/UserListPanel';
import UserCreatePanel from '@/components/admin/users/UserCreatePanel';
import UserViewPanel from '@/components/admin/users/UserViewPanel';
import FlashMessageRender from '@/components/FlashMessageRender';

export default () => {
    const match = useRouteMatch();

    return (
        <AdminContent title={'Users'} description={'Manage panel user accounts and permissions.'}>
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
        </AdminContent>
    );
};
