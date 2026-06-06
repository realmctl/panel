import React, { useState } from 'react';
import SetupStepPanel from '@/components/setup/SetupStepPanel';
import Button from '@/components/elements/Button';
import { completeSetup } from '@/api/setup/setup';
import { useSetup } from '@/components/setup/SetupContext';
import useFlash from '@/plugins/useFlash';
import styles from '@/components/setup/style.module.css';

export default () => {
    const { updateStatus } = useSetup();
    const { clearAndAddHttpError } = useFlash();
    const [submitting, setSubmitting] = useState(false);

    const onFinish = () => {
        setSubmitting(true);

        completeSetup()
            .then(({ status, intended }) => {
                updateStatus(status);
                window.location.href = intended;
            })
            .catch((error) => clearAndAddHttpError({ error }))
            .finally(() => setSubmitting(false));
    };

    return (
        <SetupStepPanel
            title={'All set'}
            description={
                <>
                    Your panel is ready. When you want to host game servers, add a node from{' '}
                    <strong>Admin → Nodes</strong> and install Wings on that machine.
                </>
            }
        >
            <div className={styles.actions}>
                <Button type={'button'} onClick={onFinish} disabled={submitting}>
                    {submitting ? 'Loading...' : 'Open dashboard'}
                </Button>
            </div>
        </SetupStepPanel>
    );
};
