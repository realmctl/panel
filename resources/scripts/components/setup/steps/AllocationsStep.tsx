import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import RealmCard from '@/components/elements/realm/RealmCard';
import Button from '@/components/elements/Button';
import SetupField, { inputClassName } from '@/components/setup/SetupField';
import { createSetupAllocations } from '@/api/setup/setup';
import { useSetup } from '@/components/setup/SetupContext';
import { getNextStepId, getStepPath } from '@/lib/setupSteps';
import useFlash from '@/plugins/useFlash';
import styles from '@/components/setup/style.module.css';

export default () => {
    const history = useHistory();
    const { status, updateStatus, refresh } = useSetup();
    const { clearAndAddHttpError } = useFlash();
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        allocationIp: '0.0.0.0',
        allocationAlias: '',
        allocationPorts: '25565-25600',
    });

    useEffect(() => {
        refresh().catch(() => undefined);
    }, []);

    const nodeId = status?.context.nodeId;

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        if (!nodeId) {
            history.push(getStepPath('node'));
            return;
        }

        setSubmitting(true);

        createSetupAllocations(nodeId, {
            allocationIp: form.allocationIp,
            allocationAlias: form.allocationAlias || undefined,
            allocationPorts: form.allocationPorts.split(',').map((value) => value.trim()).filter(Boolean),
        })
            .then((next) => {
                updateStatus(next);
                const nextStep = getNextStepId(next.steps, 'allocations') || next.currentStep;
                history.push(getStepPath(nextStep));
            })
            .catch((error) => clearAndAddHttpError({ error }))
            .finally(() => setSubmitting(false));
    };

    return (
        <RealmCard title={'Allocations'}>
            <p className={styles.stepIntro}>
                Assign ports on {status?.context.nodeName || 'your node'} for new servers.
            </p>

            <form onSubmit={onSubmit}>
                <SetupField id={'allocationIp'} label={'IP address'}>
                    <input
                        id={'allocationIp'}
                        className={inputClassName}
                        value={form.allocationIp}
                        onChange={(event) => setForm((current) => ({ ...current, allocationIp: event.target.value }))}
                        disabled={submitting}
                        required
                    />
                </SetupField>

                <SetupField id={'allocationPorts'} label={'Ports'} help={'Comma-separated or ranges, e.g. 25565-25600'}>
                    <input
                        id={'allocationPorts'}
                        className={inputClassName}
                        value={form.allocationPorts}
                        onChange={(event) => setForm((current) => ({ ...current, allocationPorts: event.target.value }))}
                        disabled={submitting}
                        required
                    />
                </SetupField>

                <div className={styles.actions}>
                    <Button type={'submit'} disabled={submitting || !nodeId}>
                        {submitting ? 'Creating...' : 'Continue'}
                    </Button>
                </div>
            </form>
        </RealmCard>
    );
};
