import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import SetupStepPanel from '@/components/setup/SetupStepPanel';
import Button from '@/components/elements/Button';
import SetupField, { inputClassName, selectClassName } from '@/components/setup/SetupField';
import { createSetupNode } from '@/api/setup/setup';
import { useSetup } from '@/components/setup/SetupContext';
import { getNextStepId, getStepPath } from '@/lib/setupSteps';
import useFlash from '@/plugins/useFlash';
import styles from '@/components/setup/style.module.css';

export default () => {
    const history = useHistory();
    const { status, updateStatus } = useSetup();
    const { clearAndAddHttpError } = useFlash();
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        name: 'Node 1',
        description: '',
        location_id: '',
        fqdn: '',
        scheme: 'https',
        behind_proxy: false,
        memory: '8192',
        memory_overallocate: '0',
        disk: '102400',
        disk_overallocate: '0',
        daemonListen: '8080',
        daemonSFTP: '2022',
        daemonBase: '/var/lib/realm/volumes',
        upload_size: '100',
    });

    const updateField = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitting(true);

        createSetupNode({
            ...form,
            location_id: Number(form.location_id || status?.context.locationId),
            memory: Number(form.memory),
            memory_overallocate: Number(form.memory_overallocate),
            disk: Number(form.disk),
            disk_overallocate: Number(form.disk_overallocate),
            daemonListen: Number(form.daemonListen),
            daemonSFTP: Number(form.daemonSFTP),
            upload_size: Number(form.upload_size),
            behind_proxy: form.behind_proxy,
        })
            .then((next) => {
                updateStatus(next);
                const nextStep = getNextStepId(next.steps, 'node') || next.currentStep;
                history.push(getStepPath(nextStep));
            })
            .catch((error) => clearAndAddHttpError({ error }))
            .finally(() => setSubmitting(false));
    };

    return (
        <SetupStepPanel title={'Node'} description={'Connect your first Wings daemon to the panel.'}>
            <form onSubmit={onSubmit}>
                <SetupField id={'nodeName'} label={'Node name'}>
                    <input
                        id={'nodeName'}
                        className={inputClassName}
                        value={form.name}
                        onChange={(event) => updateField('name', event.target.value)}
                        disabled={submitting}
                        required
                    />
                </SetupField>

                <SetupField id={'fqdn'} label={'FQDN'} help={'The domain or IP address Wings will bind to.'}>
                    <input
                        id={'fqdn'}
                        className={inputClassName}
                        value={form.fqdn}
                        onChange={(event) => updateField('fqdn', event.target.value)}
                        disabled={submitting}
                        required
                    />
                </SetupField>

                <div className={'grid grid-cols-1 gap-4 sm:grid-cols-2'}>
                    <SetupField id={'scheme'} label={'Scheme'}>
                        <select
                            id={'scheme'}
                            className={selectClassName}
                            value={form.scheme}
                            onChange={(event) => updateField('scheme', event.target.value)}
                            disabled={submitting}
                        >
                            <option value={'https'}>HTTPS</option>
                            <option value={'http'}>HTTP</option>
                        </select>
                    </SetupField>

                    <SetupField id={'daemonListen'} label={'Daemon port'}>
                        <input
                            id={'daemonListen'}
                            className={inputClassName}
                            value={form.daemonListen}
                            onChange={(event) => updateField('daemonListen', event.target.value)}
                            disabled={submitting}
                            required
                        />
                    </SetupField>
                </div>

                <div className={'grid grid-cols-1 gap-4 sm:grid-cols-2'}>
                    <SetupField id={'memory'} label={'Memory (MiB)'}>
                        <input
                            id={'memory'}
                            className={inputClassName}
                            value={form.memory}
                            onChange={(event) => updateField('memory', event.target.value)}
                            disabled={submitting}
                            required
                        />
                    </SetupField>

                    <SetupField id={'disk'} label={'Disk (MiB)'}>
                        <input
                            id={'disk'}
                            className={inputClassName}
                            value={form.disk}
                            onChange={(event) => updateField('disk', event.target.value)}
                            disabled={submitting}
                            required
                        />
                    </SetupField>
                </div>

                <div className={styles.actions}>
                    <Button type={'submit'} disabled={submitting}>
                        {submitting ? 'Creating...' : 'Create node'}
                    </Button>
                </div>
            </form>
        </SetupStepPanel>
    );
};
