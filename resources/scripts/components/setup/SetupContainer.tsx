import React from 'react';
import { Redirect, Route, Switch, useLocation, useRouteMatch } from 'react-router-dom';
import { useStoreState } from '@/state/hooks';
import Spinner from '@/components/elements/Spinner';
import { REALM_LOGO } from '@/lib/branding';
import { canAccessStep, getStepPath } from '@/lib/setupSteps';
import { SetupProvider, useSetup } from '@/components/setup/SetupContext';
import SetupSidebar from '@/components/setup/SetupSidebar';
import WelcomeStep from '@/components/setup/steps/WelcomeStep';
import AdminStep from '@/components/setup/steps/AdminStep';
import SettingsStep from '@/components/setup/steps/SettingsStep';
import LocationStep from '@/components/setup/steps/LocationStep';
import NodeStep from '@/components/setup/steps/NodeStep';
import WingsStep from '@/components/setup/steps/WingsStep';
import AllocationsStep from '@/components/setup/steps/AllocationsStep';
import ServerStep from '@/components/setup/steps/ServerStep';
import FinishStep from '@/components/setup/steps/FinishStep';
import styles from '@/components/setup/style.module.css';

const AUTHENTICATED_STEPS = new Set(['settings', 'location', 'node', 'wings', 'allocations', 'server', 'finish']);

const SetupRoutes = () => {
    const { path } = useRouteMatch();
    const stepMatch = useRouteMatch<{ step?: string }>(`${path}/:step?`);
    const location = useLocation();
    const { status, loading } = useSetup();
    const isAuthenticated = useStoreState((state) => !!state.user.data?.uuid);
    const panelName = useStoreState((state) => state.settings.data?.name || 'Realm');

    if (loading || !status) {
        return (
            <div className={styles.page}>
                <div className={styles.shell}>
                    <Spinner centered />
                </div>
            </div>
        );
    }

    if (status.complete && !location.pathname.endsWith('/finish')) {
        return <Redirect to={'/'} />;
    }

    const resolvedStepId = stepMatch?.params.step || status.currentStep;

    if (!canAccessStep(status.steps, resolvedStepId)) {
        return <Redirect to={getStepPath(status.currentStep)} />;
    }

    if (AUTHENTICATED_STEPS.has(resolvedStepId) && !isAuthenticated) {
        return (
            <Redirect
                to={getStepPath(
                    status.steps.some((step) => step.id === 'admin' && !step.skipped) ? 'admin' : 'welcome'
                )}
            />
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.shell}>
                <div className={styles.header}>
                    <img src={REALM_LOGO} className={styles.logo} alt={panelName} />
                    <h1 className={styles.headerTitle}>Setup</h1>
                </div>

                <div className={styles.layout}>
                    <SetupSidebar
                        steps={status.steps}
                        currentStepId={resolvedStepId}
                        progress={status.progress}
                    />

                    <div className={styles.content}>
                        <Switch>
                            <Route path={`${path}/welcome`} component={WelcomeStep} exact />
                            <Route path={`${path}/admin`} component={AdminStep} exact />
                            <Route path={`${path}/settings`} component={SettingsStep} exact />
                            <Route path={`${path}/location`} component={LocationStep} exact />
                            <Route path={`${path}/node`} component={NodeStep} exact />
                            <Route path={`${path}/wings`} component={WingsStep} exact />
                            <Route path={`${path}/allocations`} component={AllocationsStep} exact />
                            <Route path={`${path}/server`} component={ServerStep} exact />
                            <Route path={`${path}/finish`} component={FinishStep} exact />
                            <Route path={path} exact>
                                <Redirect to={getStepPath(status.currentStep)} />
                            </Route>
                            <Route path={'*'}>
                                <Redirect to={getStepPath(status.currentStep)} />
                            </Route>
                        </Switch>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default () => (
    <SetupProvider>
        <SetupRoutes />
    </SetupProvider>
);
