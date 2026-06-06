import React, { useState } from 'react';
import RealmCard from '@/components/elements/realm/RealmCard';
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
        <RealmCard title={'Done'}>
            <p className={styles.stepIntro}>Your panel is ready.</p>

            <div className={styles.actions}>
                <Button type={'button'} onClick={onFinish} disabled={submitting}>
                    {submitting ? 'Loading...' : 'Open dashboard'}
                </Button>
            </div>
        </RealmCard>
    );
};
