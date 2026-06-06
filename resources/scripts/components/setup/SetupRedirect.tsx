import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStoreState } from '@/state/hooks';
import { getStepPath } from '@/lib/setupSteps';

export default ({ children }: { children: React.ReactNode }) => {
    const location = useLocation();
    const setup = useStoreState((state) => state.settings.data?.setup);
    const needsSetup = !!setup?.required && !location.pathname.startsWith('/setup');

    // Transition into the setup wizard with a full page load rather than a soft
    // router redirect. The setup area boots its own SPA instance (just like the
    // auth area), so sharing a single instance across setup and the dashboard can
    // leave stale state behind that only a refresh clears.
    useEffect(() => {
        if (needsSetup && setup) {
            window.location.assign(getStepPath(setup.currentStep));
        }
    }, [needsSetup]);

    if (needsSetup) {
        return null;
    }

    return <>{children}</>;
};
