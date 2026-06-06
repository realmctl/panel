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
            <div className={styles.progressBlock}>
                <p className={styles.progressLine}>
                    <span>Progress</span>
                    <span className={styles.progressValue}>
                        {progress.completed}/{progress.total}
                    </span>
                </p>
                <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${progress.percent}%` }} />
                </div>
            </div>

            <nav className={styles.stepList} aria-label={'Setup steps'}>
                {visibleSteps.map((step, index) => {
                    const accessible = canAccessStep(steps, step.id);
                    const isActive = step.id === currentStepId;

                    return (
                        <button
                            key={step.id}
                            type={'button'}
                            disabled={!accessible}
                            aria-current={isActive ? 'step' : undefined}
                            className={[
                                styles.stepButton,
                                isActive ? styles.stepButtonActive : '',
                                step.complete ? styles.stepButtonComplete : '',
                            ]
                                .filter(Boolean)
                                .join(' ')}
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
