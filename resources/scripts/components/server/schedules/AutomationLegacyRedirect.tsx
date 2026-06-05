import React from 'react';
import { Redirect, useLocation } from 'react-router-dom';

export default () => {
    const { pathname, search } = useLocation();

    return <Redirect to={pathname.replace('/schedules', '/automation') + search} />;
};
