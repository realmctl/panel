import React, { useEffect, useState } from 'react';
import useSWR, { mutate as mutateGlobal } from 'swr';
import { Save, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import {
    getMailSettings,
    MailSettings,
    testMailSettings,
    updateMailSettings,
} from '@/api/admin/settings';
import { fieldClass, selectClass } from '@/components/admin/settings/fieldClass';
import { SettingRow, SettingsFooter, SettingsSection } from '@/components/admin/settings/settingsLayout';

const DRIVER_LABELS: Record<string, string> = {
    smtp: 'SMTP',
    mailgun: 'Mailgun',
    postmark: 'Postmark',
    resend: 'Resend',
};

export default () => {
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data, error, isValidating, mutate } = useSWR('admin-settings-mail', getMailSettings);
    const [form, setForm] = useState<MailSettings | null>(null);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);

    useEffect(() => {
        if (data?.settings) {
            setForm({ ...data.settings });
        }
    }, [data]);

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-settings', error });
        } else {
            clearFlashes('admin-settings');
        }
    }, [error]);

    const updateField = <K extends keyof MailSettings>(key: K, value: MailSettings[K]) => {
        setForm((current) => (current ? { ...current, [key]: value } : current));
    };

    const buildPayload = (): Partial<MailSettings> => {
        if (!form) return {};

        const driver = form['mail:default'];
        const payload: Partial<MailSettings> = {
            'mail:default': driver,
            'mail:from:address': form['mail:from:address'],
            'mail:from:name': form['mail:from:name'],
        };

        switch (driver) {
            case 'smtp':
                payload['mail:mailers:smtp:host'] = form['mail:mailers:smtp:host'];
                payload['mail:mailers:smtp:port'] = form['mail:mailers:smtp:port'];
                payload['mail:mailers:smtp:encryption'] = form['mail:mailers:smtp:encryption'];
                payload['mail:mailers:smtp:username'] = form['mail:mailers:smtp:username'];
                if (form['mail:mailers:smtp:password']) {
                    payload['mail:mailers:smtp:password'] = form['mail:mailers:smtp:password'];
                }
                break;
            case 'mailgun':
                payload['services:mailgun:domain'] = form['services:mailgun:domain'];
                payload['services:mailgun:endpoint'] = form['services:mailgun:endpoint'];
                if (form['services:mailgun:secret']) {
                    payload['services:mailgun:secret'] = form['services:mailgun:secret'];
                }
                break;
            case 'postmark':
                if (form['services:postmark:token']) {
                    payload['services:postmark:token'] = form['services:postmark:token'];
                }
                break;
            case 'resend':
                if (form['services:resend:key']) {
                    payload['services:resend:key'] = form['services:resend:key'];
                }
                break;
        }

        return payload;
    };

    const onSave = (event: React.FormEvent) => {
        event.preventDefault();
        if (!form) return;

        setSaving(true);
        clearFlashes('admin-settings');

        updateMailSettings(buildPayload())
            .then((response: any) => {
                addFlash({
                    key: 'admin-settings',
                    type: 'success',
                    title: 'Settings saved',
                    message: response.message,
                });
                mutate();
                // The general settings panel's "registration requires mail" state
                // depends on this, so make sure it picks up the new value too.
                mutateGlobal('admin-settings');
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-settings', error: submitError });
            })
            .finally(() => setSaving(false));
    };

    const onTest = () => {
        if (!form) return;

        setTesting(true);
        clearFlashes('admin-settings');

        updateMailSettings(buildPayload())
            .then(() => testMailSettings())
            .then((response: any) => {
                addFlash({
                    key: 'admin-settings',
                    type: 'success',
                    title: 'Test email sent',
                    message: response.message,
                });
                mutate();
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-settings', error: submitError });
            })
            .finally(() => setTesting(false));
    };

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    if (!form || !data) {
        return <p className="text-sm text-muted-foreground">Unable to load mail settings.</p>;
    }

    if (data.disabled) {
        return (
            <div className="overflow-hidden rounded-md border border-border bg-card p-5">
                <p className="text-sm text-muted-foreground">
                    Your current mail driver (<code className="text-xs text-foreground">{data.driver}</code>) cannot be
                    configured here. Use{' '}
                    <code className="text-xs text-foreground">php artisan p:environment:mail</code> or set{' '}
                    <code className="text-xs text-foreground">MAIL_MAILER</code> to{' '}
                    <code className="text-xs text-foreground">smtp</code>,{' '}
                    <code className="text-xs text-foreground">mailgun</code>,{' '}
                    <code className="text-xs text-foreground">postmark</code>, or{' '}
                    <code className="text-xs text-foreground">resend</code>.
                </p>
            </div>
        );
    }

    const driver = form['mail:default'];

    return (
        <form onSubmit={onSave} className="space-y-4">
            <SettingsSection title="Provider" description="Choose how the panel sends outgoing email.">
                <SettingRow
                    label="Mail provider"
                    htmlFor="mail-provider"
                    description="SMTP, Mailgun, Postmark, or Resend."
                >
                    <select
                        id="mail-provider"
                        className={selectClass}
                        value={driver}
                        onChange={(e) => updateField('mail:default', e.target.value)}
                    >
                        {data.providers.map((provider) => (
                            <option key={provider} value={provider}>
                                {DRIVER_LABELS[provider] ?? provider}
                            </option>
                        ))}
                    </select>
                </SettingRow>
            </SettingsSection>

            {driver === 'smtp' && (
                <SettingsSection title="SMTP" description="Connection details for your mail server.">
                    <SettingRow label="Host" htmlFor="smtp-host" description="Hostname or IP of the SMTP server.">
                        <input
                            id="smtp-host"
                            className={fieldClass}
                            value={form['mail:mailers:smtp:host']}
                            onChange={(e) => updateField('mail:mailers:smtp:host', e.target.value)}
                            required
                        />
                    </SettingRow>
                    <SettingRow label="Port & encryption" description="Typically 587 with TLS, or 465 with SSL.">
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                id="smtp-port"
                                type="number"
                                className={fieldClass}
                                value={form['mail:mailers:smtp:port']}
                                onChange={(e) => updateField('mail:mailers:smtp:port', e.target.value)}
                                required
                                aria-label="SMTP port"
                            />
                            <select
                                id="smtp-encryption"
                                className={selectClass}
                                value={form['mail:mailers:smtp:encryption'] ?? ''}
                                onChange={(e) => updateField('mail:mailers:smtp:encryption', e.target.value)}
                                aria-label="SMTP encryption"
                            >
                                <option value="">None</option>
                                <option value="tls">TLS</option>
                                <option value="ssl">SSL</option>
                            </select>
                        </div>
                    </SettingRow>
                    <SettingRow label="Username" htmlFor="smtp-username" description="Leave empty if not required.">
                        <input
                            id="smtp-username"
                            className={fieldClass}
                            value={form['mail:mailers:smtp:username'] ?? ''}
                            onChange={(e) => updateField('mail:mailers:smtp:username', e.target.value)}
                        />
                    </SettingRow>
                    <SettingRow
                        label="Password"
                        htmlFor="smtp-password"
                        description="Leave blank to keep the current password. Enter !e to clear it."
                    >
                        <input
                            id="smtp-password"
                            type="password"
                            className={fieldClass}
                            value={form['mail:mailers:smtp:password'] ?? ''}
                            onChange={(e) => updateField('mail:mailers:smtp:password', e.target.value)}
                        />
                    </SettingRow>
                </SettingsSection>
            )}

            {driver === 'mailgun' && (
                <SettingsSection title="Mailgun" description="API credentials for your Mailgun domain.">
                    <SettingRow label="Domain" htmlFor="mailgun-domain" description="The verified sending domain.">
                        <input
                            id="mailgun-domain"
                            className={fieldClass}
                            value={form['services:mailgun:domain']}
                            onChange={(e) => updateField('services:mailgun:domain', e.target.value)}
                            required
                        />
                    </SettingRow>
                    <SettingRow
                        label="API key"
                        htmlFor="mailgun-secret"
                        description="Leave blank to keep the current key."
                    >
                        <input
                            id="mailgun-secret"
                            type="password"
                            className={fieldClass}
                            value={form['services:mailgun:secret'] ?? ''}
                            onChange={(e) => updateField('services:mailgun:secret', e.target.value)}
                        />
                    </SettingRow>
                    <SettingRow
                        label="Endpoint"
                        htmlFor="mailgun-endpoint"
                        description="Use api.eu.mailgun.net for the EU region."
                    >
                        <input
                            id="mailgun-endpoint"
                            className={fieldClass}
                            value={form['services:mailgun:endpoint']}
                            onChange={(e) => updateField('services:mailgun:endpoint', e.target.value)}
                            required
                        />
                    </SettingRow>
                </SettingsSection>
            )}

            {driver === 'postmark' && (
                <SettingsSection title="Postmark" description="Server token from your Postmark account.">
                    <SettingRow
                        label="Server token"
                        htmlFor="postmark-token"
                        description="Leave blank to keep the current token."
                    >
                        <input
                            id="postmark-token"
                            type="password"
                            className={fieldClass}
                            value={form['services:postmark:token'] ?? ''}
                            onChange={(e) => updateField('services:postmark:token', e.target.value)}
                        />
                    </SettingRow>
                </SettingsSection>
            )}

            {driver === 'resend' && (
                <SettingsSection title="Resend" description="API key from your Resend dashboard.">
                    <SettingRow
                        label="API key"
                        htmlFor="resend-key"
                        description="Leave blank to keep the current key. Create one at resend.com/api-keys."
                    >
                        <input
                            id="resend-key"
                            type="password"
                            className={fieldClass}
                            value={form['services:resend:key'] ?? ''}
                            onChange={(e) => updateField('services:resend:key', e.target.value)}
                        />
                    </SettingRow>
                </SettingsSection>
            )}

            <SettingsSection title="Sender" description="From address shown on outgoing panel emails.">
                <SettingRow
                    label="From address"
                    htmlFor="mail-from-address"
                    description="Must be a valid email your provider allows."
                >
                    <input
                        id="mail-from-address"
                        type="email"
                        className={fieldClass}
                        value={form['mail:from:address']}
                        onChange={(e) => updateField('mail:from:address', e.target.value)}
                        required
                    />
                </SettingRow>
                <SettingRow
                    label="From name"
                    htmlFor="mail-from-name"
                    description="Display name recipients see in their inbox."
                >
                    <input
                        id="mail-from-name"
                        className={fieldClass}
                        value={form['mail:from:name'] ?? ''}
                        onChange={(e) => updateField('mail:from:name', e.target.value)}
                    />
                </SettingRow>
            </SettingsSection>

            <SettingsFooter>
                <Button type="button" variant="outline" disabled={testing || saving} onClick={onTest}>
                    <Send className="mr-2 h-4 w-4" />
                    {testing ? 'Sending...' : 'Send test email'}
                </Button>
                <Button type="submit" disabled={saving || testing}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save changes'}
                </Button>
            </SettingsFooter>
        </form>
    );
};
