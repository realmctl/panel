import React, { lazy } from 'react';
import { hot } from 'react-hot-loader/root';
import { Redirect, Route, Router, Switch, useLocation } from 'react-router-dom';
import { StoreProvider } from 'easy-peasy';
import { store } from '@/state';
import { SiteSettings } from '@/state/settings';
import ProgressBar from '@/components/elements/ProgressBar';
import { NotFound } from '@/components/elements/ScreenBlock';
import tw from 'twin.macro';
import GlobalStylesheet from '@/assets/css/GlobalStylesheet';
import { history } from '@/components/history';
import { setupInterceptors } from '@/api/interceptors';
import AuthenticatedRoute from '@/components/elements/AuthenticatedRoute';
import RootAdminRoute from '@/components/elements/RootAdminRoute';
import { ServerContext } from '@/state/server';
import '@/assets/tailwind.css';
import Spinner from '@/components/elements/Spinner';
import FlashToast from '@/components/FlashToast';
import SetupRedirect from '@/components/setup/SetupRedirect';

const DashboardRouter = lazy(() => import(/* webpackChunkName: "dashboard" */ '@/routers/DashboardRouter'));
const ServerRouter = lazy(() => import(/* webpackChunkName: "server" */ '@/routers/ServerRouter'));
const AuthenticationRouter = lazy(() => import(/* webpackChunkName: "auth" */ '@/routers/AuthenticationRouter'));
const SetupRouter = lazy(() => import(/* webpackChunkName: "setup" */ '@/routers/SetupRouter'));
const AdminPreviewRouter = lazy(() => import(/* webpackChunkName: "admin" */ '@/routers/AdminPreviewRouter'));

const AdminLegacyPathRedirect = () => {
    const location = useLocation();

    return (
        <Redirect
            to={{
                pathname: location.pathname.replace(/^\/admin-preview/, '/admin'),
                search: location.search,
                hash: location.hash,
            }}
        />
    );
};

interface ExtendedWindow extends Window {
    SiteConfiguration?: SiteSettings;
    RealmUser?: {
        uuid: string;
        username: string;
        email: string;
        /* eslint-disable camelcase */
        name_first: string;
        root_admin: boolean;
        use_totp: boolean;
        language: string;
        updated_at: string;
        created_at: string;
        /* eslint-enable camelcase */
    };
}

setupInterceptors(history);

const App = () => {
    const { RealmUser, SiteConfiguration } = window as ExtendedWindow;
    if (RealmUser && !store.getState().user.data) {
        store.getActions().user.setUserData({
            uuid: RealmUser.uuid,
            username: RealmUser.username,
            email: RealmUser.email,
            language: RealmUser.language,
            nameFirst: RealmUser.name_first,
            rootAdmin: RealmUser.root_admin,
            useTotp: RealmUser.use_totp,
            createdAt: new Date(RealmUser.created_at),
            updatedAt: new Date(RealmUser.updated_at),
        });
    }

    if (!store.getState().settings.data) {
        store.getActions().settings.setSettings({
            ...SiteConfiguration!,
            setup: SiteConfiguration?.setup ?? {
                required: false,
                complete: true,
                currentStep: 'finish',
                steps: [],
                progress: { completed: 0, total: 0, percent: 100 },
            },
        });
    }

    return (
        <>
            <GlobalStylesheet />
            <StoreProvider store={store}>
                <ProgressBar />
                <FlashToast />
                <div css={tw`mx-auto w-auto`}>
                    <Router history={history}>
                        <SetupRedirect>
                            <Switch>
                                <Route path={'/setup'}>
                                    <Spinner.Suspense>
                                        <SetupRouter />
                                    </Spinner.Suspense>
                                </Route>
                                <Route path={'/auth'}>
                                    <Spinner.Suspense>
                                        <AuthenticationRouter />
                                    </Spinner.Suspense>
                                </Route>
                                <AuthenticatedRoute path={'/server/:id'}>
                                    <Spinner.Suspense>
                                        <ServerContext.Provider>
                                            <ServerRouter />
                                        </ServerContext.Provider>
                                    </Spinner.Suspense>
                                </AuthenticatedRoute>
                                <AuthenticatedRoute path={'/admin-preview'}>
                                    <AdminLegacyPathRedirect />
                                </AuthenticatedRoute>
                                <AuthenticatedRoute path={'/admin'}>
                                    <RootAdminRoute>
                                        <Spinner.Suspense>
                                            <AdminPreviewRouter />
                                        </Spinner.Suspense>
                                    </RootAdminRoute>
                                </AuthenticatedRoute>
                                <AuthenticatedRoute path={'/'}>
                                    <Spinner.Suspense>
                                        <DashboardRouter />
                                    </Spinner.Suspense>
                                </AuthenticatedRoute>
                                <Route path={'*'}>
                                    <NotFound />
                                </Route>
                            </Switch>
                        </SetupRedirect>
                    </Router>
                </div>
            </StoreProvider>
        </>
    );
};

export default hot(App);
