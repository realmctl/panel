import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import SetupContainer from '@/components/setup/SetupContainer';

export default () => {
    const { path } = useRouteMatch();

    return (
        <Switch>
            <Route path={path} component={SetupContainer} />
        </Switch>
    );
};
