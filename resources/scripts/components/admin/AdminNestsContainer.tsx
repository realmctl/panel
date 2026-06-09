import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import AdminContent from '@/components/admin/AdminContent';
import NestListPanel from '@/components/admin/nests/NestListPanel';
import NestCreatePanel from '@/components/admin/nests/NestCreatePanel';
import NestViewPanel from '@/components/admin/nests/NestViewPanel';
import EggCreatePanel from '@/components/admin/nests/EggCreatePanel';
import EggConfigPanel from '@/components/admin/nests/EggConfigPanel';
import EggVariablesPanel from '@/components/admin/nests/EggVariablesPanel';
import EggScriptsPanel from '@/components/admin/nests/EggScriptsPanel';
import FlashMessageRender from '@/components/FlashMessageRender';

export default () => {
    const match = useRouteMatch();

    return (
        <AdminContent title={'Nests'} description={'Manage nests, eggs, variables, and install scripts.'}>
            <FlashMessageRender byKey={'admin-nests'} className={'mb-4'} />
            <Switch>
                <Route path={`${match.path}/eggs/new`}>
                    <EggCreatePanel />
                </Route>
                <Route path={`${match.path}/eggs/:id/variables`}>
                    <EggVariablesPanel />
                </Route>
                <Route path={`${match.path}/eggs/:id/scripts`}>
                    <EggScriptsPanel />
                </Route>
                <Route path={`${match.path}/eggs/:id`}>
                    <EggConfigPanel />
                </Route>
                <Route path={`${match.path}/new`}>
                    <NestCreatePanel />
                </Route>
                <Route path={`${match.path}/:id`}>
                    <NestViewPanel />
                </Route>
                <Route path={match.path} exact>
                    <NestListPanel />
                </Route>
            </Switch>
        </AdminContent>
    );
};
