import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import AdminPreviewContent from '@/components/admin-preview/AdminPreviewContent';
import NestListPanel from '@/components/admin-preview/nests/NestListPanel';
import NestCreatePanel from '@/components/admin-preview/nests/NestCreatePanel';
import NestViewPanel from '@/components/admin-preview/nests/NestViewPanel';
import EggCreatePanel from '@/components/admin-preview/nests/EggCreatePanel';
import EggConfigPanel from '@/components/admin-preview/nests/EggConfigPanel';
import EggVariablesPanel from '@/components/admin-preview/nests/EggVariablesPanel';
import EggScriptsPanel from '@/components/admin-preview/nests/EggScriptsPanel';
import FlashMessageRender from '@/components/FlashMessageRender';

export default () => {
    const match = useRouteMatch();

    return (
        <AdminPreviewContent title={'Nests'} description={'Manage nests, eggs, variables, and install scripts.'}>
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
        </AdminPreviewContent>
    );
};
