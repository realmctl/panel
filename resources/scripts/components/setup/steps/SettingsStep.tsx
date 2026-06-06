import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import SetupStepPanel from '@/components/setup/SetupStepPanel';
import Button from '@/components/elements/Button';
import SetupField, { inputClassName, selectClassName } from '@/components/setup/SetupField';
import { updateSetupSettings } from '@/api/setup/setup';
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
        name: '',
        locale: 'en',
        registrationEnabled: false,
    });

    useEffect(() => {
        if (!status) {
            return;
        }

        setForm({
            name: status.context.panelName,
            locale: status.context.panelLocale,
            registrationEnabled: false,
        });
    }, [status]);

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitting(true);

        updateSetupSettings(form)
            .then((next) => {
                updateStatus(next);
                const nextStep = getNextStepId(next.steps, 'settings') || next.currentStep;
                history.push(getStepPath(nextStep));
            })
            .catch((error) => clearAndAddHttpError({ error }))
            .finally(() => setSubmitting(false));
    };

    return (
        <SetupStepPanel title={'Panel settings'} description={'How your panel appears to users.'}>
            <form onSubmit={onSubmit}>
                <SetupField id={'panelName'} label={'Panel name'}>
                    <input
                        id={'panelName'}
                        className={inputClassName}
                        value={form.name}
                        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                        disabled={submitting}
                        required
                    />
                </SetupField>

                <SetupField id={'panelLocale'} label={'Default language'}>
                    <select
                        id={'panelLocale'}
                        className={selectClassName}
                        value={form.locale}
                        onChange={(event) => setForm((current) => ({ ...current, locale: event.target.value }))}
                        disabled={submitting}
                    >
                        {Object.entries(status?.context.locales || { en: 'English' }).map(([code, label]) => (
                            <option key={code} value={code}>
                                {label}
                            </option>
                        ))}
                    </select>
                </SetupField>

                <SetupField
                    id={'registrationEnabled'}
                    label={'Allow user registration'}
                    help={'When enabled, users can create accounts from the login page.'}
                >
                    <select
                        id={'registrationEnabled'}
                        className={selectClassName}
                        value={form.registrationEnabled ? 'true' : 'false'}
                        onChange={(event) =>
                            setForm((current) => ({
                                ...current,
                                registrationEnabled: event.target.value === 'true',
                            }))
                        }
                        disabled={submitting}
                    >
                        <option value={'false'}>Disabled</option>
                        <option value={'true'}>Enabled</option>
                    </select>
                </SetupField>

                <div className={styles.actions}>
                    <Button type={'submit'} disabled={submitting}>
                        {submitting ? 'Saving...' : 'Save and continue'}
                    </Button>
                </div>
            </form>
        </SetupStepPanel>
    );
};
