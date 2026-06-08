import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import SetupStepPanel from '@/components/setup/SetupStepPanel';
import Button from '@/components/elements/Button';
import SetupField, { inputClassName } from '@/components/setup/SetupField';
import { continueSetupLocation, createSetupLocation } from '@/api/setup/setup';
import { useSetup } from '@/components/setup/SetupContext';
import { getNextStepId, getStepPath } from '@/lib/setupSteps';
import useFlash from '@/plugins/useFlash';
import styles from '@/components/setup/style.module.css';

export default () => {
    const history = useHistory();
    const { status, updateStatus } = useSetup();
    const { clearAndAddHttpError } = useFlash();
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ short: '', long: '' });
    const updateField = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) => {
        setForm((current) => ({ ...current, [field]: value }));
    };
    const hasExistingLocation = !!status?.context.locationId;

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

    const onContinue = () => {
        setSubmitting(true);

        continueSetupLocation()
            .then((next) => {
                updateStatus(next);
                const nextStep = getNextStepId(next.steps, 'location') || next.currentStep;
                history.push(getStepPath(nextStep));
            })
            .catch((error) => clearAndAddHttpError({ error }))
            .finally(() => setSubmitting(false));
    };

    if (hasExistingLocation) {
        return (
            <SetupStepPanel
                title={'Location'}
                description={'A location is already configured on this panel. Continue to the next step.'}
            >
                <div className={styles.actions}>
                    <Button type={'button'} onClick={onContinue} disabled={submitting}>
                        {submitting ? 'Loading...' : 'Continue'}
                    </Button>
                </div>
            </SetupStepPanel>
        );
    }

    return (
        <SetupStepPanel title={'Location'} description={'Add a geographic location for your nodes.'}>
            <form onSubmit={onSubmit}>
                <SetupField id={'short'} label={'Short code'} help={'A short identifier, e.g. us-east'}>
                    <input
                        id={'short'}
                        className={inputClassName}
                        value={form.short}
                        onChange={(event) => updateField('short', event.target.value)}
                        disabled={submitting}
                        required
                    />
                </SetupField>

                <SetupField id={'long'} label={'Description'} help={'Optional longer description for this location.'}>
                    <input
                        id={'long'}
                        className={inputClassName}
                        value={form.long}
                        onChange={(event) => updateField('long', event.target.value)}
                        disabled={submitting}
                    />
                </SetupField>

                <div className={styles.actions}>
                    <Button type={'submit'} disabled={submitting}>
                        {submitting ? 'Creating...' : 'Create location'}
                    </Button>
                </div>
            </form>
        </SetupStepPanel>
    );
};
