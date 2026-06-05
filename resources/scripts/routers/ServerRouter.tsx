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

const INSIGHT_NAV_PATHS = new Set(['/metrics', '/activity']);

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
        .find((r) => {
            const routePath = to(r.path);
            return r.exact
                ? location.pathname === routePath
                : location.pathname.startsWith(routePath.replace(/\/$/, ''));
        });

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
                        rightActions={<ServerPowerControls variant={'header'} />}
                        breadcrumbs={serverBreadcrumbs}
                    >
                        <CSSTransition timeout={150} classNames={'fade'} appear in>
                            <SubNavigation>
                                <div>
                                    {routes.server
                                        .filter((route) => !!route.name && !INSIGHT_NAV_PATHS.has(route.path))
                                        .map((route) =>
                                            route.permission ? (
                                                <Can key={route.path} action={route.permission} matchAny>
                                                    <NavLink to={to(route.path, true)} exact={route.exact}>
                                                        {route.name}
                                                    </NavLink>
                                                </Can>
                                            ) : (
                                                <NavLink key={route.path} to={to(route.path, true)} exact={route.exact}>
                                                    {route.name}
                                                </NavLink>
                                            )
                                        )}
                                    <ServerInsightsNav to={to} />
                                    {rootAdmin && (
                                        // eslint-disable-next-line react/jsx-no-target-blank
                                        <a href={`/admin/servers/view/${serverId}`} target={'_blank'}>
                                            <FontAwesomeIcon icon={faExternalLinkAlt} />
                                        </a>
                                    )}
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
                                    {routes.server.map(({ path, permission, component: Component, exact }) => (
                                        <PermissionRoute key={path} permission={permission} path={to(path)} exact={exact ?? true}>
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
