import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { AlertTriangle, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { getSecuritySettings, SecuritySettings, updateSecuritySettings } from '@/api/admin/settings';
import { fieldClass, selectClass } from '@/components/admin/settings/fieldClass';
import { SettingRow, SettingsFooter, SettingsSection } from '@/components/admin/settings/settingsLayout';
import { cn } from '@/lib/utils';

const TimeoutInput = ({
    id,
    value,
    onChange,
}: {
    id: string;
    value: number;
    onChange: (value: number) => void;
}) => (
    <div className="flex">
        <input
            id={id}
            type="number"
            min={1}
            max={60}
            className={cn(fieldClass, 'rounded-r-none')}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            required
        />
        <span className="flex h-10 items-center rounded-r-md border border-l-0 border-border bg-muted px-3 text-sm text-muted-foreground">
            sec
        </span>
    </div>
);

export default () => {
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data, error, isValidating, mutate } = useSWR('admin-settings-security', getSecuritySettings);
    const [form, setForm] = useState<SecuritySettings | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (data?.settings) {
            setForm(data.settings);
        }
    }, [data]);

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-settings', error });
        } else {
            clearFlashes('admin-settings');
        }
    }, [error]);

    const updateField = <K extends keyof SecuritySettings>(key: K, value: SecuritySettings[K]) => {
        setForm((current) => (current ? { ...current, [key]: value } : current));
    };

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!form) return;

        setSaving(true);
        clearFlashes('admin-settings');

        updateSecuritySettings(form)
            .then((response: any) => {
                addFlash({
                    key: 'admin-settings',
                    type: 'success',
                    title: 'Settings saved',
                    message: response.message,
                });
                mutate();
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-settings', error: submitError });
            })
            .finally(() => setSaving(false));
    };

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    if (!form) {
        return <p className="text-sm text-muted-foreground">Unable to load security settings.</p>;
    }

    const provider = form['captcha:provider'];

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <SettingsSection
                title="CAPTCHA"
                description="Protect login and password reset forms from automated abuse."
            >
                <SettingRow
                    label="Provider"
                    htmlFor="captcha-provider"
                    description="Google reCAPTCHA, Cloudflare Turnstile, or disabled."
                >
                    <select
                        id="captcha-provider"
                        className={selectClass}
                        value={provider}
                        onChange={(e) =>
                            updateField(
                                'captcha:provider',
                                e.target.value as SecuritySettings['captcha:provider']
                            )
                        }
                    >
                        <option value="recaptcha">Google reCAPTCHA</option>
                        <option value="turnstile">Cloudflare Turnstile</option>
                        <option value="none">Disabled</option>
                    </select>
                </SettingRow>

                {provider === 'recaptcha' && (
                    <>
                        <SettingRow
                            label="Site key"
                            htmlFor="recaptcha-site-key"
                            description="Public key from the Google reCAPTCHA admin console."
                        >
                            <input
                                id="recaptcha-site-key"
                                className={fieldClass}
                                value={form['captcha:recaptcha:website_key']}
                                onChange={(e) => updateField('captcha:recaptcha:website_key', e.target.value)}
                                required
                            />
                        </SettingRow>
                        <SettingRow
                            label="Secret key"
                            htmlFor="recaptcha-secret-key"
                            description="Private key used to verify CAPTCHA responses."
                        >
                            <input
                                id="recaptcha-secret-key"
                                className={fieldClass}
                                value={form['captcha:recaptcha:secret_key']}
                                onChange={(e) => updateField('captcha:recaptcha:secret_key', e.target.value)}
                                required
                            />
                        </SettingRow>
                    </>
                )}

                {provider === 'turnstile' && (
                    <>
                        <SettingRow
                            label="Site key"
                            htmlFor="turnstile-site-key"
                            description="Public key from your Cloudflare Turnstile widget."
                        >
                            <input
                                id="turnstile-site-key"
                                className={fieldClass}
                                value={form['captcha:turnstile:website_key']}
                                onChange={(e) => updateField('captcha:turnstile:website_key', e.target.value)}
                                required
                            />
                        </SettingRow>
                        <SettingRow
                            label="Secret key"
                            htmlFor="turnstile-secret-key"
                            description="Private key used to verify Turnstile responses."
                        >
                            <input
                                id="turnstile-secret-key"
                                className={fieldClass}
                                value={form['captcha:turnstile:secret_key']}
                                onChange={(e) => updateField('captcha:turnstile:secret_key', e.target.value)}
                                required
                            />
                        </SettingRow>
                    </>
                )}

                {data?.showRecaptchaWarning && provider === 'recaptcha' && (
                    <div className="flex gap-3 border-t border-amber-500/20 bg-amber-500/5 px-5 py-4 text-sm text-muted-foreground">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                        <p>
                            You are using default reCAPTCHA keys shipped with this panel. For better security,{' '}
                            <a
                                href="https://www.google.com/recaptcha/admin"
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-400 hover:text-blue-300"
                            >
                                generate your own invisible reCAPTCHA keys
                            </a>{' '}
                            tied to your domain.
                        </p>
                    </div>
                )}
            </SettingsSection>

            <SettingsSection
                title="HTTP connections"
                description="Timeouts for outbound requests made by the panel."
            >
                <SettingRow
                    label="Connection timeout"
                    htmlFor="connect-timeout"
                    description="How long to wait when establishing a connection."
                >
                    <TimeoutInput
                        id="connect-timeout"
                        value={form['realm:guzzle:connect_timeout']}
                        onChange={(value) => updateField('realm:guzzle:connect_timeout', value)}
                    />
                </SettingRow>
                <SettingRow
                    label="Request timeout"
                    htmlFor="request-timeout"
                    description="Maximum time to wait for a full response."
                >
                    <TimeoutInput
                        id="request-timeout"
                        value={form['realm:guzzle:timeout']}
                        onChange={(value) => updateField('realm:guzzle:timeout', value)}
                    />
                </SettingRow>
            </SettingsSection>

            <SettingsFooter>
                <Button type="submit" disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save changes'}
                </Button>
            </SettingsFooter>
        </form>
    );
};
