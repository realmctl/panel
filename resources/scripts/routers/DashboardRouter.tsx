import React, { useMemo } from 'react';
import { NavLink, Route, Switch } from 'react-router-dom';
import NavigationBar from '@/components/NavigationBar';
import DashboardContainer from '@/components/dashboard/DashboardContainer';
import { NotFound } from '@/components/elements/ScreenBlock';
import TransitionRouter from '@/TransitionRouter';
import SubNavigation from '@/components/elements/SubNavigation';
import PageHeader from '@/components/elements/PageHeader';
import { useLocation } from 'react-router';
import Spinner from '@/components/elements/Spinner';
import routes from '@/routers/routes';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';

const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
};

const greetings: Record<string, string[]> = {
    morning: [
        'Good morning, {name}',
        'Rise and shine, {name}',
        'Morning, {name}! Ready to go?',
        'Hey {name}, fresh start today',
        'Top of the morning, {name}',
    ],
    afternoon: [
        'Good afternoon, {name}',
        'Hey {name}, back at it',
        'What\'s up, {name}',
        'Afternoon, {name}! Let\'s get it done',
        'Hey there, {name}',
    ],
    evening: [
        'Good evening, {name}',
        'Hey {name}, burning the midnight oil?',
        'Evening, {name}! Still going strong',
        'Hey {name}, wrapping things up?',
        'Night owl mode, {name}',
    ],
};

export default () => {
    const location = useLocation();
    const firstName = useStoreState((state: ApplicationStore) => state.user.data!.nameFirst);

    const dashboardGreeting = useMemo(() => {
        const storageKey = 'dashboard_greeting';
        const stored = sessionStorage.getItem(storageKey);
        if (stored) return stored;

        const timeOfDay = getTimeOfDay();
        const options = greetings[timeOfDay];
        const greeting = options[Math.floor(Math.random() * options.length)].replace('{name}', firstName);
        sessionStorage.setItem(storageKey, greeting);
        return greeting;
    }, [firstName]);

    const getPageTitle = () => {
        if (location.pathname === '/') return dashboardGreeting;
        if (location.pathname.startsWith('/account')) return 'Account';
        return dashboardGreeting;
    };

    return (
        <>
            <NavigationBar />
            <PageHeader title={getPageTitle()}>
                {location.pathname.startsWith('/account') && (
                    <SubNavigation>
                        <div>
                            {routes.account
                                .filter((route) => !!route.name)
                                .map(({ path, name, exact = false }) => (
                                    <NavLink key={path} to={`/account/${path}`.replace('//', '/')} exact={exact}>
                                        {name}
                                    </NavLink>
                                ))}
                        </div>
                    </SubNavigation>
                )}
            </PageHeader>
            <TransitionRouter>
                <React.Suspense fallback={<Spinner centered />}>
                    <Switch location={location}>
                        <Route path={'/'} exact>
                            <DashboardContainer />
                        </Route>
                        {routes.account.map(({ path, component: Component }) => (
                            <Route key={path} path={`/account/${path}`.replace('//', '/')} exact>
                                <Component />
                            </Route>
                        ))}
                        <Route path={'*'}>
                            <NotFound />
                        </Route>
                    </Switch>
                </React.Suspense>
            </TransitionRouter>
        </>
    );
};
