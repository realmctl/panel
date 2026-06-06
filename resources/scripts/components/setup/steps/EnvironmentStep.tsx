import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import SetupStepPanel from '@/components/setup/SetupStepPanel';
import Button from '@/components/elements/Button';
import SetupField, { inputClassName, selectClassName } from '@/components/setup/SetupField';
import { configureSetupEnvironment } from '@/api/setup/setup';
import { useSetup } from '@/components/setup/SetupContext';
import { getNextStepId, getStepPath } from '@/lib/setupSteps';
import { getSetupTimezones } from '@/lib/setupTimezones';
import useFlash from '@/plugins/useFlash';
import styles from '@/components/setup/style.module.css';

const DRIVER_LABELS: Record<string, string> = {
    redis: 'Redis',
    memcached: 'Memcached',
    file: 'Filesystem',
    database: 'MySQL',
    cookie: 'Cookie',
    sync: 'Sync',
};

const formatDriver = (driver: string) => DRIVER_LABELS[driver] || driver;

const SETUP_TIMEZONES = getSetupTimezones();

interface EnvironmentForm {
    author: string;
    url: string;
    timezone: string;
    cache: string;
    session: string;
    queue: string;
    redisHost: string;
    redisPort: number;
    redisPassword: string;
}

const defaultForm = (): EnvironmentForm => ({
    author: '',
    url: '',
    timezone: 'UTC',
    cache: 'redis',
    session: 'redis',
    queue: 'redis',
    redisHost: '127.0.0.1',
    redisPort: 6379,
    redisPassword: '',
});

type SetupStatusEnvironment = {
    author: string;
    url: string;
    timezone: string;
    cache: string;
    session: string;
    queue: string;
    redisHost: string;
    redisPort: number;
};

const normalizeEnvironment = (environment: SetupStatusEnvironment): EnvironmentForm => ({
    author: environment.author === 'unknown@unknown.com' ? '' : String(environment.author ?? ''),
    url: String(environment.url ?? ''),
    timezone: String(environment.timezone ?? 'UTC'),
    cache: String(environment.cache ?? 'redis'),
    session: String(environment.session ?? 'redis'),
    queue: String(environment.queue ?? 'redis'),
    redisHost: String(environment.redisHost ?? '127.0.0.1'),
    redisPort: Number(environment.redisPort) || 6379,
    redisPassword: '',
});

const TimezoneField = memo(
    ({
        value,
        disabled,
        onChange,
    }: {
        value: string;
        disabled: boolean;
        onChange: (timezone: string) => void;
    }) => (
        <SetupField id={'timezone'} label={'Timezone'}>
            <select
                id={'timezone'}
                className={selectClassName}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                disabled={disabled}
                required
            >
                {SETUP_TIMEZONES.map((timezone) => (
                    <option key={timezone} value={timezone}>
                        {timezone}
                    </option>
                ))}
            </select>
        </SetupField>
    )
);
TimezoneField.displayName = 'TimezoneField';

const DriverSettings = memo(
    ({
        form,
        submitting,
        showAdvanced,
        onToggle,
        onChange,
    }: {
        form: EnvironmentForm;
        submitting: boolean;
        showAdvanced: boolean;
        onToggle: () => void;
        onChange: (patch: Partial<EnvironmentForm>) => void;
    }) => {
        const usesRedis = [form.cache, form.session, form.queue].some((driver) => driver === 'redis');
        const driverSummary = `${formatDriver(form.cache)} · ${formatDriver(form.session)} · ${formatDriver(form.queue)}`;

        return (
            <div className={styles.advancedSection}>
                <button
                    type={'button'}
                    className={styles.advancedToggle}
                    onClick={onToggle}
                    aria-expanded={showAdvanced}
                >
                    <span
                        className={[styles.advancedToggleIcon, showAdvanced ? styles.advancedToggleIconOpen : '']
                            .filter(Boolean)
                            .join(' ')}
                        aria-hidden={'true'}
                    >
                        ›
                    </span>
                    <span className={styles.advancedToggleContent}>
                        <span className={styles.advancedToggleLabel}>Driver settings</span>
                        <span className={styles.advancedToggleHint}>
                            {showAdvanced
                                ? 'Cache, session, and queue drivers. Redis is recommended for most installs.'
                                : driverSummary}
                        </span>
                    </span>
                </button>

                {showAdvanced && (
                    <div className={styles.advancedPanel}>
                        <div className={styles.driverGrid}>
                            <SetupField id={'cache'} label={'Cache'}>
                                <select
                                    id={'cache'}
                                    className={selectClassName}
                                    value={form.cache}
                                    onChange={(event) => onChange({ cache: event.target.value })}
                                    disabled={submitting}
                                >
                                    <option value={'redis'}>Redis</option>
                                    <option value={'memcached'}>Memcached</option>
                                    <option value={'file'}>Filesystem</option>
                                </select>
                            </SetupField>

                            <SetupField id={'session'} label={'Session'}>
                                <select
                                    id={'session'}
                                    className={selectClassName}
                                    value={form.session}
                                    onChange={(event) => onChange({ session: event.target.value })}
                                    disabled={submitting}
                                >
                                    <option value={'redis'}>Redis</option>
                                    <option value={'memcached'}>Memcached</option>
                                    <option value={'database'}>MySQL</option>
                                    <option value={'file'}>Filesystem</option>
                                    <option value={'cookie'}>Cookie</option>
                                </select>
                            </SetupField>

                            <SetupField id={'queue'} label={'Queue'}>
                                <select
                                    id={'queue'}
                                    className={selectClassName}
                                    value={form.queue}
                                    onChange={(event) => onChange({ queue: event.target.value })}
                                    disabled={submitting}
                                >
                                    <option value={'redis'}>Redis</option>
                                    <option value={'database'}>MySQL</option>
                                    <option value={'sync'}>Sync</option>
                                </select>
                            </SetupField>
                        </div>

                        {usesRedis && (
                            <div className={styles.redisGroup}>
                                <p className={styles.redisGroupTitle}>Redis connection</p>
                                <div className={styles.redisGrid}>
                                    <SetupField id={'redisHost'} label={'Host'}>
                                        <input
                                            id={'redisHost'}
                                            className={inputClassName}
                                            value={form.redisHost}
                                            onChange={(event) => onChange({ redisHost: event.target.value })}
                                            disabled={submitting}
                                        />
                                    </SetupField>

                                    <SetupField id={'redisPort'} label={'Port'}>
                                        <input
                                            id={'redisPort'}
                                            type={'number'}
                                            className={inputClassName}
                                            value={form.redisPort}
                                            onChange={(event) =>
                                                onChange({ redisPort: Number(event.target.value) || 6379 })
                                            }
                                            disabled={submitting}
                                        />
                                    </SetupField>

                                    <SetupField
                                        id={'redisPassword'}
                                        label={'Password'}
                                        help={'Leave blank if Redis has no password.'}
                                    >
                                        <input
                                            id={'redisPassword'}
                                            type={'password'}
                                            className={inputClassName}
                                            value={form.redisPassword}
                                            onChange={(event) => onChange({ redisPassword: event.target.value })}
                                            disabled={submitting}
                                        />
                                    </SetupField>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }
);
DriverSettings.displayName = 'DriverSettings';

export default () => {
    const history = useHistory();
    const { status, updateStatus } = useSetup();
    const { clearAndAddHttpError } = useFlash();
    const initialized = useRef(false);
    const [submitting, setSubmitting] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [form, setForm] = useState<EnvironmentForm>(defaultForm);

    useEffect(() => {
        if (!status?.context.environment || initialized.current) {
            return;
        }

        initialized.current = true;
        setForm(normalizeEnvironment(status.context.environment));
    }, [status?.context.environment]);

    const updateForm = useCallback((patch: Partial<EnvironmentForm>) => {
        setForm((current) => ({ ...current, ...patch }));
    }, []);

    const onTimezoneChange = useCallback((timezone: string) => updateForm({ timezone }), [updateForm]);

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitting(true);

        configureSetupEnvironment({
            ...form,
            redisPassword: form.redisPassword || undefined,
        })
            .then((next) => {
                updateStatus(next);
                const nextStep = getNextStepId(next.steps, 'environment') || next.currentStep;
                history.push(getStepPath(nextStep));
            })
            .catch((error) => clearAndAddHttpError({ error }))
            .finally(() => setSubmitting(false));
    };

    return (
        <SetupStepPanel
            title={'Environment'}
            description={
                <>
                    Configure the application URL and core environment settings. This replaces running{' '}
                    <code>php artisan p:environment:setup</code> on the server.
                </>
            }
        >
            <form onSubmit={onSubmit}>
                <SetupField
                    id={'author'}
                    label={'Egg author email'}
                    help={'Used as the contact address for eggs exported from this panel.'}
                >
                    <input
                        id={'author'}
                        type={'email'}
                        className={inputClassName}
                        value={form.author}
                        onChange={(event) => updateForm({ author: event.target.value })}
                        disabled={submitting}
                        required
                    />
                </SetupField>

                <SetupField
                    id={'url'}
                    label={'Application URL'}
                    help={'Must include http:// or https:// and match the address you use in the browser.'}
                >
                    <input
                        id={'url'}
                        type={'url'}
                        className={inputClassName}
                        value={form.url}
                        onChange={(event) => updateForm({ url: event.target.value })}
                        disabled={submitting}
                        required
                    />
                </SetupField>

                <TimezoneField value={form.timezone} disabled={submitting} onChange={onTimezoneChange} />

                <DriverSettings
                    form={form}
                    submitting={submitting}
                    showAdvanced={showAdvanced}
                    onToggle={() => setShowAdvanced((current) => !current)}
                    onChange={updateForm}
                />

                <div className={styles.actions}>
                    <Button type={'submit'} disabled={submitting}>
                        {submitting ? 'Saving...' : 'Save and continue'}
                    </Button>
                </div>
            </form>
        </SetupStepPanel>
    );
};
