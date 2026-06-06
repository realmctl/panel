import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import RealmCard from '@/components/elements/realm/RealmCard';
import Button from '@/components/elements/Button';
import { acknowledgeWelcome } from '@/api/setup/setup';
import { useSetup } from '@/components/setup/SetupContext';
import { getNextStepId, getStepPath } from '@/lib/setupSteps';
import useFlash from '@/plugins/useFlash';
import styles from '@/components/setup/style.module.css';

export default () => {
    const history = useHistory();
    const { updateStatus } = useSetup();
    const { clearAndAddHttpError } = useFlash();
    const [submitting, setSubmitting] = useState(false);

    const onContinue = () => {
        setSubmitting(true);

        acknowledgeWelcome()
            .then((next) => {
                updateStatus(next);
                const nextStep = getNextStepId(next.steps, 'welcome') || next.currentStep;
                history.push(getStepPath(nextStep));
            })
            .catch((error) => clearAndAddHttpError({ error }))
            .finally(() => setSubmitting(false));
    };

    return (
        <RealmCard title={'Welcome'}>
            <p className={styles.stepIntro}>
                Configure your panel, connect Wings, and get ready to host servers.
            </p>

            <div className={styles.actions}>
                <Button onClick={onContinue} disabled={submitting}>
                    {submitting ? 'Loading...' : 'Continue'}
                </Button>
            </div>
        </RealmCard>
    );
};
