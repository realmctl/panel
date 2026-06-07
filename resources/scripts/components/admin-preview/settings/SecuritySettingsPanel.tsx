import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { AlertTriangle, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { getSecuritySettings, SecuritySettings, updateSecuritySettings } from '@/api/admin/settings';
import { fieldClass, selectClass } from '@/components/admin-preview/settings/fieldClass';
import { cn } from '@/lib/utils';

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

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    if (!form) {
        return <p className="text-sm text-muted-foreground">Unable to load security settings.</p>;
    }

    const provider = form['captcha:provider'];

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <div className="rounded-lg border border-border bg-card">
                <div className="border-b border-border px-5 py-4">
                    <h2 className="text-base font-semibold text-foreground">CAPTCHA</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Protect login and password reset forms from automated abuse.
                    </p>
                </div>

                <div className="space-y-5 p-5">
                    <div className="space-y-2 md:max-w-sm">
                        <Label htmlFor="captcha-provider">Provider</Label>
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
                    </div>

                    {provider === 'recaptcha' && (
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="recaptcha-site-key">reCAPTCHA site key</Label>
                                <input
                                    id="recaptcha-site-key"
                                    className={fieldClass}
                                    value={form['captcha:recaptcha:website_key']}
                                    onChange={(e) => updateField('captcha:recaptcha:website_key', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="recaptcha-secret-key">reCAPTCHA secret key</Label>
                                <input
                                    id="recaptcha-secret-key"
                                    className={fieldClass}
                                    value={form['captcha:recaptcha:secret_key']}
                                    onChange={(e) => updateField('captcha:recaptcha:secret_key', e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {provider === 'turnstile' && (
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="turnstile-site-key">Turnstile site key</Label>
                                <input
                                    id="turnstile-site-key"
                                    className={fieldClass}
                                    value={form['captcha:turnstile:website_key']}
                                    onChange={(e) => updateField('captcha:turnstile:website_key', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="turnstile-secret-key">Turnstile secret key</Label>
                                <input
                                    id="turnstile-secret-key"
                                    className={fieldClass}
                                    value={form['captcha:turnstile:secret_key']}
                                    onChange={(e) => updateField('captcha:turnstile:secret_key', e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {data?.showRecaptchaWarning && provider === 'recaptcha' && (
                        <div className="flex gap-3 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-foreground">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
                            <p>
                                You are currently using reCAPTCHA keys that were shipped with this panel. For improved
                                security it is recommended to{' '}
                                <a
                                    href="https://www.google.com/recaptcha/admin"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary"
                                >
                                    generate new invisible reCAPTCHA keys
                                </a>{' '}
                                tied to your website.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="rounded-lg border border-border bg-card">
                <div className="border-b border-border px-5 py-4">
                    <h2 className="text-base font-semibold text-foreground">HTTP connections</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Timeouts for outbound HTTP requests made by the panel.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="connect-timeout">Connection timeout</Label>
                        <div className="flex">
                            <input
                                id="connect-timeout"
                                type="number"
                                min={1}
                                max={60}
                                className={cn(fieldClass, 'rounded-r-none')}
                                value={form['pterodactyl:guzzle:connect_timeout']}
                                onChange={(e) =>
                                    updateField('pterodactyl:guzzle:connect_timeout', Number(e.target.value))
                                }
                                required
                            />
                            <span className="flex h-10 items-center rounded-r-md border border-l-0 border-border bg-muted px-3 text-sm text-muted-foreground">
                                seconds
                            </span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="request-timeout">Request timeout</Label>
                        <div className="flex">
                            <input
                                id="request-timeout"
                                type="number"
                                min={1}
                                max={60}
                                className={cn(fieldClass, 'rounded-r-none')}
                                value={form['pterodactyl:guzzle:timeout']}
                                onChange={(e) => updateField('pterodactyl:guzzle:timeout', Number(e.target.value))}
                                required
                            />
                            <span className="flex h-10 items-center rounded-r-md border border-l-0 border-border bg-muted px-3 text-sm text-muted-foreground">
                                seconds
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end border-t border-border px-5 py-4">
                    <Button type="submit" disabled={saving}>
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? 'Saving...' : 'Save changes'}
                    </Button>
                </div>
            </div>
        </form>
    );
};
