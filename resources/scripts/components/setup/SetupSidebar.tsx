import React from 'react';
import { useHistory } from 'react-router-dom';
import { SetupStep } from '@/state/settings';
import { canAccessStep, getStepPath } from '@/lib/setupSteps';
import styles from '@/components/setup/style.module.css';

interface Props {
    steps: SetupStep[];
    currentStepId: string;
    progress: {
        completed: number;
        total: number;
        percent: number;
    };
}

export default ({ steps, currentStepId, progress }: Props) => {
    const history = useHistory();
    const visibleSteps = steps.filter((step) => !step.skipped);

    return (
        <aside className={styles.sidebar}>
            <div>
                <p className={styles.progressLine}>
                    {progress.completed} / {progress.total} complete
                </p>
                <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${progress.percent}%` }} />
                </div>
            </div>

            <nav className={styles.stepList}>
                {visibleSteps.map((step, index) => {
                    const accessible = canAccessStep(steps, step.id);
                    const isActive = step.id === currentStepId;

                    return (
                        <button
                            key={step.id}
                            type={'button'}
                            disabled={!accessible}
                            className={[
                                styles.stepButton,
                                isActive ? styles.stepButtonActive : '',
                                step.complete ? styles.stepButtonComplete : '',
                            ].filter(Boolean).join(' ')}
                            onClick={() => accessible && history.push(getStepPath(step.id))}
                        >
                            <span className={styles.stepIndex}>{step.complete ? '✓' : index + 1}</span>
                            <span className={styles.stepLabel}>{step.label}</span>
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
};
