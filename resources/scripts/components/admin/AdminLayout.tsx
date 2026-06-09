import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { useLocation } from 'react-router';
import Spinner from '@/components/elements/Spinner';
import { NotFound } from '@/components/elements/ScreenBlock';
import { AdminSidebar } from '@/components/ui/sidebar';
import { adminBasePath, adminRoutes, fullPathFor } from '@/routers/adminRoutes';

export default () => {
    const location = useLocation();

    return (
        <div className="dark min-h-screen bg-background text-foreground">
            <AdminSidebar />
            <main className="min-h-screen pl-[3.05rem] md:pl-60">
                <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-6 lg:px-8 lg:py-10 2xl:max-w-[90rem]">
                    <React.Suspense fallback={<Spinner centered />}>
                        <Switch location={location}>
                            {adminRoutes.map((route) => (
                                <Route
                                    key={route.path}
                                    path={fullPathFor(route)}
                                    exact={route.exact}
                                >
                                    <route.component />
                                </Route>
                            ))}
                            <Route path={`${adminBasePath}/*`}>
                                <NotFound />
                            </Route>
                        </Switch>
                    </React.Suspense>
                </div>
            </main>
        </div>
    );
};
