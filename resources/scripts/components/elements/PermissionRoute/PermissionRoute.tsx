import React from 'react';
import { Route } from 'react-router-dom';
import { RouteProps } from 'react-router';
import Can from '@/components/elements/Can';
import { NotFound, ServerError } from '@/components/elements/ScreenBlock';
import { ServerContext } from '@/state/server';
import { EggCategoryFeature, serverHasEggFeature } from '@/lib/eggCategories';

interface Props extends Omit<RouteProps, 'path'> {
    path: string;
    permission: string | string[] | null;
    feature?: EggCategoryFeature;
}

export default ({ permission, feature, children, ...props }: Props) => {
    const eggCategory = ServerContext.useStoreState((state) => state.server.data?.eggCategory ?? null);

    if (feature && !serverHasEggFeature(eggCategory, feature)) {
        return (
            <Route {...props}>
                <NotFound />
            </Route>
        );
    }

    return (
        <Route {...props}>
            {!permission ? (
                children
            ) : (
                <Can
                    matchAny
                    action={permission}
                    renderOnError={
                        <ServerError title={'Access Denied'} message={'You do not have permission to access this page.'} />
                    }
                >
                    {children}
                </Can>
            )}
        </Route>
    );
};
