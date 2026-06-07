import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Save, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import {
    getMailSettings,
    MailSettings,
    testMailSettings,
    updateMailSettings,
} from '@/api/admin/settings';
import { fieldClass, selectClass } from '@/components/admin-preview/settings/fieldClass';

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
            .then((response) => {
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

    const onTest = () => {
        if (!form) return;

        setTesting(true);
        clearFlashes('admin-settings');

        updateMailSettings(buildPayload())
            .then(() => testMailSettings())
            .then((response) => {
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
            <div className="rounded-lg border border-border bg-card p-5">
                <div className="rounded-md border border-primary/30 bg-primary/10 p-4 text-sm text-foreground">
                    Your current mail driver (<code className="text-xs">{data.driver}</code>) is not configurable
                    through this interface. Please use{' '}
                    <code className="text-xs">php artisan p:environment:mail</code> to update your mail settings, or
                    set <code className="text-xs">MAIL_MAILER</code> to one of:{' '}
                    <code className="text-xs">smtp</code>, <code className="text-xs">mailgun</code>,{' '}
                    <code className="text-xs">postmark</code>, or <code className="text-xs">resend</code>.
                </div>
            </div>
        );
    }

    const driver = form['mail:default'];

    return (
        <form onSubmit={onSave} className="space-y-6">
            <div className="rounded-lg border border-border bg-card">
                <div className="border-b border-border px-5 py-4">
                    <h2 className="text-base font-semibold text-foreground">Email settings</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Configure outgoing mail for panel notifications and account emails.
                    </p>
                </div>

                <div className="space-y-5 p-5">
                    <div className="space-y-2 md:max-w-sm">
                        <Label htmlFor="mail-provider">Mail provider</Label>
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
                        <p className="text-xs text-muted-foreground">
                            Select the mail provider you want to use for sending emails.
                        </p>
                    </div>

                    {driver === 'smtp' && (
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="smtp-host">SMTP host</Label>
                                <input
                                    id="smtp-host"
                                    className={fieldClass}
                                    value={form['mail:mailers:smtp:host']}
                                    onChange={(e) => updateField('mail:mailers:smtp:host', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="smtp-port">SMTP port</Label>
                                    <input
                                        id="smtp-port"
                                        type="number"
                                        className={fieldClass}
                                        value={form['mail:mailers:smtp:port']}
                                        onChange={(e) => updateField('mail:mailers:smtp:port', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="smtp-encryption">Encryption</Label>
                                    <select
                                        id="smtp-encryption"
                                        className={selectClass}
                                        value={form['mail:mailers:smtp:encryption'] ?? ''}
                                        onChange={(e) =>
                                            updateField('mail:mailers:smtp:encryption', e.target.value)
                                        }
                                    >
                                        <option value="">None</option>
                                        <option value="tls">TLS</option>
                                        <option value="ssl">SSL</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="smtp-username">Username</Label>
                                <input
                                    id="smtp-username"
                                    className={fieldClass}
                                    value={form['mail:mailers:smtp:username'] ?? ''}
                                    onChange={(e) => updateField('mail:mailers:smtp:username', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="smtp-password">Password</Label>
                                <input
                                    id="smtp-password"
                                    type="password"
                                    className={fieldClass}
                                    value={form['mail:mailers:smtp:password'] ?? ''}
                                    onChange={(e) => updateField('mail:mailers:smtp:password', e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Leave blank to keep the existing password. Enter <code>!e</code> to clear it.
                                </p>
                            </div>
                        </div>
                    )}

                    {driver === 'mailgun' && (
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="mailgun-domain">Mailgun domain</Label>
                                <input
                                    id="mailgun-domain"
                                    className={fieldClass}
                                    value={form['services:mailgun:domain']}
                                    onChange={(e) => updateField('services:mailgun:domain', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mailgun-secret">Mailgun API key</Label>
                                <input
                                    id="mailgun-secret"
                                    type="password"
                                    className={fieldClass}
                                    value={form['services:mailgun:secret'] ?? ''}
                                    onChange={(e) => updateField('services:mailgun:secret', e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">Leave blank to keep the existing key.</p>
                            </div>
                            <div className="space-y-2 md:col-span-2 md:max-w-md">
                                <Label htmlFor="mailgun-endpoint">Mailgun endpoint</Label>
                                <input
                                    id="mailgun-endpoint"
                                    className={fieldClass}
                                    value={form['services:mailgun:endpoint']}
                                    onChange={(e) => updateField('services:mailgun:endpoint', e.target.value)}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    Use <code>api.eu.mailgun.net</code> for EU region.
                                </p>
                            </div>
                        </div>
                    )}

                    {driver === 'postmark' && (
                        <div className="space-y-2 md:max-w-md">
                            <Label htmlFor="postmark-token">Postmark server token</Label>
                            <input
                                id="postmark-token"
                                type="password"
                                className={fieldClass}
                                value={form['services:postmark:token'] ?? ''}
                                onChange={(e) => updateField('services:postmark:token', e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Leave blank to keep the existing token.</p>
                        </div>
                    )}

                    {driver === 'resend' && (
                        <div className="space-y-2 md:max-w-md">
                            <Label htmlFor="resend-key">Resend API key</Label>
                            <input
                                id="resend-key"
                                type="password"
                                className={fieldClass}
                                value={form['services:resend:key'] ?? ''}
                                onChange={(e) => updateField('services:resend:key', e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Leave blank to keep the existing key. Get one at{' '}
                                <a
                                    href="https://resend.com/api-keys"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary"
                                >
                                    resend.com/api-keys
                                </a>
                                .
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-5 border-t border-border pt-5 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="mail-from-address">Mail from address</Label>
                            <input
                                id="mail-from-address"
                                type="email"
                                className={fieldClass}
                                value={form['mail:from:address']}
                                onChange={(e) => updateField('mail:from:address', e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="mail-from-name">Mail from name</Label>
                            <input
                                id="mail-from-name"
                                className={fieldClass}
                                value={form['mail:from:name'] ?? ''}
                                onChange={(e) => updateField('mail:from:name', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
                    <Button type="button" variant="outline" disabled={testing || saving} onClick={onTest}>
                        <Send className="mr-2 h-4 w-4" />
                        {testing ? 'Testing...' : 'Test'}
                    </Button>
                    <Button type="submit" disabled={saving || testing}>
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? 'Saving...' : 'Save changes'}
                    </Button>
                </div>
            </div>
        </form>
    );
};
