import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { useLocation } from 'react-router';
import Spinner from '@/components/elements/Spinner';
import { NotFound } from '@/components/elements/ScreenBlock';
import { AdminPreviewSidebar } from '@/components/ui/sidebar';
import { adminPreviewBasePath, adminPreviewRoutes } from '@/routers/adminPreviewRoutes';

export default () => {
    const location = useLocation();

    return (
        <div className="dark flex h-screen w-screen flex-row bg-background text-foreground">
            <AdminPreviewSidebar />
            <main className="flex h-screen grow flex-col overflow-auto pl-[3.05rem]">
                <div className="flex w-full flex-1 justify-center px-6 py-8 lg:px-10 lg:py-10">
                    <div className="w-full max-w-4xl">
                    <React.Suspense fallback={<Spinner centered />}>
                        <Switch location={location}>
                            {adminPreviewRoutes.map(({ path, component: Component, exact }) => (
                                <Route
                                    key={path}
                                    path={
                                        path === '/'
                                            ? adminPreviewBasePath
                                            : `${adminPreviewBasePath}${path}`.replace('//', '/')
                                    }
                                    exact={exact}
                                >
                                    <Component />
                                </Route>
                            ))}
                            <Route path={`${adminPreviewBasePath}/*`}>
                                <NotFound />
                            </Route>
                        </Switch>
                    </React.Suspense>
                    </div>
                </div>
            </main>
        </div>
    );
};
