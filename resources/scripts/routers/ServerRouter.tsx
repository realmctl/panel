import TransferListener from '@/components/server/TransferListener';
import React, { useEffect, useRef, useState } from 'react';
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
import { faEllipsisH, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { useLocation } from 'react-router';
import ConflictStateRenderer from '@/components/server/ConflictStateRenderer';
import PermissionRoute from '@/components/elements/PermissionRoute';
import routes from '@/routers/routes';

const INSIGHT_NAV_PATHS = new Set(['/metrics', '/activity']);

const ServerPowerHeader = () => {
    const status = ServerContext.useStoreState((state) => state.status.value);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);
    const [moreOpen, setMoreOpen] = useState(false);
    const moreRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
                setMoreOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const sendPowerAction = (action: string) => {
        if (instance) {
            instance.send('set state', action);
        }
        setMoreOpen(false);
    };

    return (
        <div className={'flex items-center gap-2'}>
            {status === 'running' && (
                <button
                    onClick={() => sendPowerAction('stop')}
                    className={'px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md border-0 cursor-pointer transition-colors duration-150'}
                >
                    Shut down
                </button>
            )}
            {(status === 'offline' || status === null) && (
                <button
                    onClick={() => sendPowerAction('start')}
                    className={'px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md border-0 cursor-pointer transition-colors duration-150'}
                >
                    Start
                </button>
            )}
            <div className={'relative'} ref={moreRef}>
                <button
                    onClick={() => setMoreOpen(!moreOpen)}
                    className={'flex items-center justify-center w-9 h-9 text-neutral-300 hover:text-neutral-100 bg-neutral-700/50 hover:bg-neutral-700 rounded-md border-0 cursor-pointer transition-colors duration-150'}
                >
                    <FontAwesomeIcon icon={faEllipsisH} />
                </button>
                {moreOpen && (
                    <div
                        className={'absolute right-0 top-full mt-2 w-44 rounded-lg shadow-lg py-1 z-50 border border-[#2d3338]'}
                        style={{ backgroundColor: '#1e2a2f' }}
                    >
                        <button
                            onClick={() => sendPowerAction('restart')}
                            disabled={status === 'offline' || status === null}
                            className={'flex items-center w-full px-4 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 border-0 bg-transparent cursor-pointer transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed'}
                        >
                            Restart
                        </button>
                        <button
                            onClick={() => sendPowerAction('kill')}
                            disabled={status === 'offline' || status === null}
                            className={'flex items-center w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-neutral-700/50 border-0 bg-transparent cursor-pointer transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed'}
                        >
                            Kill Server
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

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
                    <PageHeader title={serverName || 'Server'} rightActions={<ServerPowerHeader />} breadcrumbs={serverBreadcrumbs}>
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
                                    {routes.server.map(({ path, permission, component: Component }) => (
                                        <PermissionRoute key={path} permission={permission} path={to(path)} exact>
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
