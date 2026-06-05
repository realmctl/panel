import React from 'react';
import { Redirect, useRouteMatch } from 'react-router-dom';

export default () => {
    const match = useRouteMatch<{ id: string }>();

    return <Redirect to={`${match!.url.replace(/\/startup\/?$/, '/settings')}?tab=startup`} />;
};
