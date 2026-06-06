import { SetupStep } from '@/state/settings';

export const SETUP_STEP_ORDER = [
    'welcome',
    'admin',
    'settings',
    'location',
    'node',
    'wings',
    'allocations',
    'server',
    'finish',
] as const;

export type SetupStepId = (typeof SETUP_STEP_ORDER)[number];

export const getStepPath = (stepId: string): string => `/setup/${stepId}`;

export const getNextStepId = (steps: SetupStep[], currentStepId: string): string | null => {
    const visible = steps.filter((step) => !step.skipped);
    const currentIndex = visible.findIndex((step) => step.id === currentStepId);

    if (currentIndex === -1 || currentIndex >= visible.length - 1) {
        return null;
    }

    return visible[currentIndex + 1].id;
};

export const canAccessStep = (steps: SetupStep[], stepId: string): boolean => {
    const visible = steps.filter((step) => !step.skipped);
    const targetIndex = visible.findIndex((step) => step.id === stepId);

    if (targetIndex === -1) {
        return false;
    }

    for (let index = 0; index < targetIndex; index++) {
        if (!visible[index].complete) {
            return false;
        }
    }

    return true;
};
