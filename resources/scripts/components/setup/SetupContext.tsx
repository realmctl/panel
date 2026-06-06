import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getSetupStatus, SetupStatus } from '@/api/setup/setup';
import { useStoreActions, useStoreState } from '@/state/hooks';
import { SetupConfiguration, SiteSettings } from '@/state/settings';

interface SetupContextValue {
    status: SetupStatus | null;
    loading: boolean;
    refresh: () => Promise<SetupStatus>;
    updateStatus: (status: SetupStatus) => void;
}

const SetupContext = createContext<SetupContextValue | null>(null);

const setupStateChanged = (current: SetupConfiguration | undefined, next: SetupConfiguration): boolean => {
    if (!current) {
        return true;
    }

    if (
        current.required !== next.required ||
        current.complete !== next.complete ||
        current.currentStep !== next.currentStep ||
        current.progress.completed !== next.progress.completed ||
        current.progress.total !== next.progress.total
    ) {
        return true;
    }

    if (current.steps.length !== next.steps.length) {
        return true;
    }

    return current.steps.some(
        (step, index) =>
            step.id !== next.steps[index]?.id || step.complete !== next.steps[index]?.complete
    );
};

export const SetupProvider = ({ children }: { children: React.ReactNode }) => {
    const [status, setStatus] = useState<SetupStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const settings = useStoreState((state) => state.settings.data);
    const { setSettings } = useStoreActions((actions) => actions.settings);
    const settingsRef = useRef(settings);
    settingsRef.current = settings;

    const syncSettings = useCallback(
        (next: SetupConfiguration) => {
            const current = settingsRef.current;

            if (!current || !setupStateChanged(current.setup, next)) {
                return;
            }

            const updated: SiteSettings = {
                ...current,
                setup: {
                    required: next.required,
                    complete: next.complete,
                    currentStep: next.currentStep,
                    steps: next.steps,
                    progress: next.progress,
                },
            };

            setSettings(updated);
        },
        [setSettings]
    );

    const applyStatus = useCallback(
        (next: SetupStatus) => {
            setStatus(next);
            syncSettings(next);
        },
        [syncSettings]
    );

    const refresh = useCallback(async () => {
        const next = await getSetupStatus();
        applyStatus(next);
        return next;
    }, [applyStatus]);

    const updateStatus = useCallback(
        (next: SetupStatus) => {
            applyStatus(next);
        },
        [applyStatus]
    );

    useEffect(() => {
        let active = true;

        getSetupStatus()
            .then((next) => {
                if (active) {
                    applyStatus(next);
                }
            })
            .catch(() => undefined)
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, [applyStatus]);

    return (
        <SetupContext.Provider value={{ status, loading, refresh, updateStatus }}>
            {children}
        </SetupContext.Provider>
    );
};

export const useSetup = (): SetupContextValue => {
    const context = useContext(SetupContext);

    if (!context) {
        throw new Error('useSetup must be used within SetupProvider');
    }

    return context;
};
