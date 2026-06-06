import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import RealmCard from '@/components/elements/realm/RealmCard';
import Button from '@/components/elements/Button';
import SetupField, { inputClassName } from '@/components/setup/SetupField';
import { createSetupLocation } from '@/api/setup/setup';
import { useSetup } from '@/components/setup/SetupContext';
import { getNextStepId, getStepPath } from '@/lib/setupSteps';
import useFlash from '@/plugins/useFlash';
import styles from '@/components/setup/style.module.css';

export default () => {
    const history = useHistory();
    const { updateStatus } = useSetup();
    const { clearAndAddHttpError } = useFlash();
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ short: '', long: '' });

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitting(true);

        createSetupLocation(form)
            .then((next) => {
                updateStatus(next);
                const nextStep = getNextStepId(next.steps, 'location') || next.currentStep;
                history.push(getStepPath(nextStep));
            })
            .catch((error) => clearAndAddHttpError({ error }))
            .finally(() => setSubmitting(false));
    };

    return (
        <RealmCard title={'Location'}>
            <p className={styles.stepIntro}>Add a location for your nodes.</p>

            <form onSubmit={onSubmit}>
                <SetupField id={'short'} label={'Short code'} help={'A short identifier, e.g. us-east'}>
                    <input
                        id={'short'}
                        className={inputClassName}
                        value={form.short}
                        onChange={(event) => setForm((current) => ({ ...current, short: event.target.value }))}
                        disabled={submitting}
                        required
                    />
                </SetupField>

                <SetupField id={'long'} label={'Description'} help={'Optional longer description for this location.'}>
                    <input
                        id={'long'}
                        className={inputClassName}
                        value={form.long}
                        onChange={(event) => setForm((current) => ({ ...current, long: event.target.value }))}
                        disabled={submitting}
                    />
                </SetupField>

                <div className={styles.actions}>
                    <Button type={'submit'} disabled={submitting}>
                        {submitting ? 'Creating...' : 'Create location'}
                    </Button>
                </div>
            </form>
        </RealmCard>
    );
};
