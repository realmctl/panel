import TransferListener from '@/components/server/TransferListener';
import React, { useEffect, useState } from 'react';
import { NavLink, Route, Switch, useRouteMatch } from 'react-router-dom';
import NavigationBar from '@/components/NavigationBar';
import TransitionRouter from '@/TransitionRouter';
import WebsocketHandler from '@/components/server/WebsocketHandler';
import { ServerContext } from '@/state/server';
import { CSSTransition } from 'react-transition-group';
import Can from '@/components/elements/Can';
import Spinner from '@/components/elements/Spinner';
import { NotFound, ServerError } from '@/components/elements/ScreenBlock';
import { httpErrorToHuman } from '@/api/http';
import { useStoreState } from 'easy-peasy';
import SubNavigation from '@/components/elements/SubNavigation';
import ServerInsightsNav from '@/components/server/ServerInsightsNav';
import ServerVersionNav from '@/components/server/ServerVersionNav';
import ServerOnlinePlayers from '@/components/server/players/ServerOnlinePlayers';
import PageHeader from '@/components/elements/PageHeader';
import InstallListener from '@/components/server/InstallListener';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { useLocation } from 'react-router';
import ConflictStateRenderer from '@/components/server/ConflictStateRenderer';
import PermissionRoute from '@/components/elements/PermissionRoute';
import ServerPowerControls from '@/components/server/console/ServerPowerControls';
import routes from '@/routers/routes';
import { isNavRouteActive, toNavigationPath } from '@/lib/routePaths';
import { serverHasEggFeature } from '@/lib/eggCategories';

const HIDDEN_NAV_PATHS = new Set(['/metrics', '/activity', '/versions']);

export default () => {
    const match = useRouteMatch<{ id: string }>();
    const location = useLocation();

    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [error, setError] = useState('');

    const id = ServerContext.useStoreState((state) => state.server.data?.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const serverName = ServerContext.useStoreState((state) => state.server.data?.name);
    const inConflictState = ServerContext.useStoreState((state) => state.server.inConflictState);
    const serverId = ServerContext.useStoreState((state) => state.server.data?.internalId);
    const eggCategory = ServerContext.useStoreState((state) => state.server.data?.eggCategory ?? null);
    const getServer = ServerContext.useStoreActions((actions) => actions.server.getServer);
    const clearServerState = ServerContext.useStoreActions((actions) => actions.clearServerState);

    const to = (value: string, url = false) => {
        if (value === '/') {
            return url ? match.url : match.path;
        }
        return `${(url ? match.url : match.path).replace(/\/*$/, '')}/${value.replace(/^\/+/, '')}`;
    };

    useEffect(
        () => () => {
            clearServerState();
        },
        []
    );

    useEffect(() => {
        setError('');

        getServer(match.params.id).catch((error) => {
            console.error(error);
            setError(httpErrorToHuman(error));
        });

        return () => {
            clearServerState();
        };
    }, [match.params.id]);

    const activeRoute = routes.server
        .filter((r) => !!r.name)
        .find((r) => isNavRouteActive(r.path, location.pathname, match.url, r.exact));

    // The overview page renders its own hero with power controls, so hide the header ones there.
    const isOverviewPage = activeRoute?.path === '/';

    const serverBreadcrumbs = [
        { label: 'Home', to: '/' },
        ...(serverName ? [{ label: serverName }] : []),
        ...(activeRoute?.name ? [{ label: activeRoute.name }] : []),
    ];

    return (
        <React.Fragment key={'server-router'}>
            <NavigationBar />
            {!uuid || !id ? (
                error ? (
                    <ServerError message={error} />
                ) : (
                    <Spinner size={'large'} centered />
                )
            ) : (
                <>
                    <PageHeader
                        title={serverName || 'Server'}
                        belowTitle={<ServerOnlinePlayers />}
                        rightActions={isOverviewPage ? undefined : <ServerPowerControls />}
                        breadcrumbs={serverBreadcrumbs}
                    >
                        <CSSTransition timeout={150} classNames={'fade'} appear in>
                            <SubNavigation>
                                <div>
                                    {routes.server
                                        .filter((route) => {
                                            if (!route.name || HIDDEN_NAV_PATHS.has(route.path)) {
                                                return false;
                                            }

                                            if (route.feature && !serverHasEggFeature(eggCategory, route.feature)) {
                                                return false;
                                            }

                                            return true;
                                        })
                                        .map((route) => {
                                            const navTo = to(toNavigationPath(route.path), true);
                                            const navExact = route.path.includes(':') ? false : route.exact;

                                            return route.permission ? (
                                                <Can key={route.path} action={route.permission} matchAny>
                                                    <NavLink to={navTo} exact={navExact}>
                                                        {route.name}
                                                    </NavLink>
                                                </Can>
                                            ) : (
                                                <NavLink key={route.path} to={navTo} exact={navExact}>
                                                    {route.name}
                                                </NavLink>
                                            );
                                        })}
                                    <ServerInsightsNav to={to} />
                                    {rootAdmin && (
                                        // eslint-disable-next-line react/jsx-no-target-blank
                                        <a href={`/admin/servers/view/${serverId}`} target={'_blank'}>
                                            <FontAwesomeIcon icon={faExternalLinkAlt} />
                                        </a>
                                    )}
                                    <div className={'nav-trailing-actions'}>
                                        <ServerVersionNav />
                                    </div>
                                </div>
                            </SubNavigation>
                        </CSSTransition>
                    </PageHeader>
                    <InstallListener />
                    <TransferListener />
                    <WebsocketHandler />
                    {inConflictState && (!rootAdmin || (rootAdmin && !location.pathname.endsWith(`/server/${id}`))) ? (
                        <ConflictStateRenderer />
                    ) : (
                        <ErrorBoundary>
                            <TransitionRouter>
                                <Switch location={location}>
                                    {routes.server.map(({ path, permission, feature, component: Component, exact }) => (
                                        <PermissionRoute
                                            key={path}
                                            permission={permission}
                                            feature={feature}
                                            path={to(path)}
                                            exact={exact ?? true}
                                        >
                                            <Spinner.Suspense>
                                                <Component />
                                            </Spinner.Suspense>
                                        </PermissionRoute>
                                    ))}
                                    <Route path={'*'} component={NotFound} />
                                </Switch>
                            </TransitionRouter>
                        </ErrorBoundary>
                    )}
                </>
            )}
        </React.Fragment>
    );
};
