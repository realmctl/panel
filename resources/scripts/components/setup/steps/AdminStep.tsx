import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import SetupStepPanel from '@/components/setup/SetupStepPanel';
import Button from '@/components/elements/Button';
import SetupField, { inputClassName } from '@/components/setup/SetupField';
import { createSetupAdmin } from '@/api/setup/setup';
import { useSetup } from '@/components/setup/SetupContext';
import { getNextStepId, getStepPath } from '@/lib/setupSteps';
import { useStoreActions } from '@/state/hooks';
import useFlash from '@/plugins/useFlash';
import styles from '@/components/setup/style.module.css';

export default () => {
    const history = useHistory();
    const { updateStatus, refresh } = useSetup();
    const { setUserData } = useStoreActions((actions) => actions.user);
    const { clearAndAddHttpError } = useFlash();
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [form, setForm] = useState({
        nameFirst: '',
        nameLast: '',
        email: '',
        username: '',
        password: '',
        passwordConfirmation: '',
    });

    const onChange = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setForm((current) => ({ ...current, [field]: event.target.value }));
        setErrors((current) => ({ ...current, [field]: '' }));
    };

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitting(true);
        setErrors({});

        createSetupAdmin(form)
            .then(async (response) => {
                if (response.user) {
                    setUserData({
                        uuid: response.user.uuid,
                        username: response.user.username,
                        email: response.user.email,
                        language: response.user.language,
                        nameFirst: response.user.name_first,
                        rootAdmin: response.user.root_admin,
                        useTotp: response.user.use_totp,
                        createdAt: new Date(response.user.created_at),
                        updatedAt: new Date(response.user.updated_at),
                    });
                }

                const next = await refresh();
                const nextStep = getNextStepId(next.steps, 'admin') || next.currentStep;
                history.push(getStepPath(nextStep));
            })
            .catch((error) => {
                if (error.response?.status === 422) {
                    const validationErrors: Record<string, string> = {};
                    Object.entries(error.response.data.errors || {}).forEach(([key, messages]) => {
                        const mappedKey = key.replace('name_first', 'nameFirst')
                            .replace('name_last', 'nameLast')
                            .replace('password_confirmation', 'passwordConfirmation');
                        validationErrors[mappedKey] = (messages as string[])[0];
                    });
                    setErrors(validationErrors);
                    return;
                }

                clearAndAddHttpError({ error });
            })
            .finally(() => setSubmitting(false));
    };

    return (
        <SetupStepPanel title={'Administrator'} description={'Create the first admin account for this panel.'}>
            <form onSubmit={onSubmit}>
                <div className={'grid grid-cols-1 gap-4 sm:grid-cols-2'}>
                    <SetupField id={'nameFirst'} label={'First name'} error={errors.nameFirst}>
                        <input
                            id={'nameFirst'}
                            className={inputClassName}
                            value={form.nameFirst}
                            onChange={onChange('nameFirst')}
                            disabled={submitting}
                            required
                        />
                    </SetupField>
                    <SetupField id={'nameLast'} label={'Last name'} error={errors.nameLast}>
                        <input
                            id={'nameLast'}
                            className={inputClassName}
                            value={form.nameLast}
                            onChange={onChange('nameLast')}
                            disabled={submitting}
                            required
                        />
                    </SetupField>
                </div>

                <SetupField id={'email'} label={'Email'} error={errors.email}>
                    <input
                        id={'email'}
                        type={'email'}
                        className={inputClassName}
                        value={form.email}
                        onChange={onChange('email')}
                        disabled={submitting}
                        required
                    />
                </SetupField>

                <SetupField id={'username'} label={'Username'} error={errors.username}>
                    <input
                        id={'username'}
                        className={inputClassName}
                        value={form.username}
                        onChange={onChange('username')}
                        disabled={submitting}
                        required
                    />
                </SetupField>

                <SetupField id={'password'} label={'Password'} error={errors.password}>
                    <input
                        id={'password'}
                        type={'password'}
                        className={inputClassName}
                        value={form.password}
                        onChange={onChange('password')}
                        disabled={submitting}
                        required
                    />
                </SetupField>

                <SetupField id={'passwordConfirmation'} label={'Confirm password'} error={errors.passwordConfirmation}>
                    <input
                        id={'passwordConfirmation'}
                        type={'password'}
                        className={inputClassName}
                        value={form.passwordConfirmation}
                        onChange={onChange('passwordConfirmation')}
                        disabled={submitting}
                        required
                    />
                </SetupField>

                <div className={styles.actions}>
                    <Button type={'submit'} disabled={submitting}>
                        {submitting ? 'Creating account...' : 'Create administrator'}
                    </Button>
                </div>
            </form>
        </SetupStepPanel>
    );
};
