import React from 'react';
import { Redirect, useLocation } from 'react-router-dom';
import { useStoreState } from '@/state/hooks';
import { getStepPath } from '@/lib/setupSteps';

export default ({ children }: { children: React.ReactNode }) => {
    const location = useLocation();
    const setup = useStoreState((state) => state.settings.data?.setup);

    if (setup?.required && !location.pathname.startsWith('/setup')) {
        return <Redirect to={getStepPath(setup.currentStep)} />;
    }

    return <>{children}</>;
};
