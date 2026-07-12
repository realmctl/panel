import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import LoginContainer from '@/components/auth/LoginContainer';
import ForgotPasswordContainer from '@/components/auth/ForgotPasswordContainer';
import ResetPasswordContainer from '@/components/auth/ResetPasswordContainer';
import LoginCheckpointContainer from '@/components/auth/LoginCheckpointContainer';
import RegisterContainer from '@/components/auth/RegisterContainer';
import VerifyEmailContainer from '@/components/auth/VerifyEmailContainer';
import OAuthCompleteContainer from '@/components/auth/OAuthCompleteContainer';
import { NotFound } from '@/components/elements/ScreenBlock';
import { useHistory, useLocation } from 'react-router';

export default () => {
    const history = useHistory();
    const location = useLocation();
    const { path } = useRouteMatch();

    return (
        <Switch location={location}>
            <Route path={`${path}/login`} component={LoginContainer} exact />
            <Route path={`${path}/login/checkpoint`} component={LoginCheckpointContainer} />
            <Route path={`${path}/register`} component={RegisterContainer} exact />
            <Route path={`${path}/oauth/complete`} component={OAuthCompleteContainer} exact />
            <Route path={`${path}/password`} component={ForgotPasswordContainer} exact />
            <Route path={`${path}/password/reset/:token`} component={ResetPasswordContainer} />
            <Route path={`${path}/verify-email/:id/:hash`} component={VerifyEmailContainer} />
            <Route path={`${path}/checkpoint`} />
            <Route path={'*'}>
                <NotFound onBack={() => history.push('/auth/login')} />
            </Route>
        </Switch>
    );
};
