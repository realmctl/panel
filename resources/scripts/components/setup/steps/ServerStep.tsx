import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import SetupStepPanel from '@/components/setup/SetupStepPanel';
import Button from '@/components/elements/Button';
import { skipSetupServer } from '@/api/setup/setup';
import { useSetup } from '@/components/setup/SetupContext';
import { getStepPath } from '@/lib/setupSteps';
import useFlash from '@/plugins/useFlash';
import styles from '@/components/setup/style.module.css';

export default () => {
    const history = useHistory();
    const { updateStatus } = useSetup();
    const { clearAndAddHttpError } = useFlash();
    const [submitting, setSubmitting] = useState(false);

    const onContinue = () => {
        setSubmitting(true);

        skipSetupServer()
            .then((next) => {
                updateStatus(next);
                history.push(getStepPath('finish'));
            })
            .catch((error) => clearAndAddHttpError({ error }))
            .finally(() => setSubmitting(false));
    };

    return (
        <SetupStepPanel
            title={'First server'}
            description={'Create your first server from the admin area after setup, or skip for now.'}
        >
            <div className={styles.actions}>
                <Button type={'button'} onClick={onContinue} disabled={submitting}>
                    {submitting ? 'Loading...' : 'Skip and finish'}
                </Button>
            </div>
        </SetupStepPanel>
    );
};
