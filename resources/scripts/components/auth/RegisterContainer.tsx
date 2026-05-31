import React, { useEffect, useRef, useState } from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import { useStoreState } from 'easy-peasy';
import Reaptcha from 'reaptcha';
import useFlash from '@/plugins/useFlash';
import AuthToast from '@/components/auth/AuthToast';
import AuthFooter from '@/components/auth/AuthFooter';
import http from '@/api/http';

const Spinner = () => (
    <svg className={'animate-spin h-4 w-4 text-white'} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className={'opacity-25'} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className={'opacity-75'} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
);

interface FormData {
    nameFirst: string;
    nameLast: string;
    email: string;
    username: string;
    password: string;
    passwordConfirmation: string;
}

const RegisterContainer = ({ history }: RouteComponentProps) => {
    const captchaRef = useRef<Reaptcha>(null);
    const [token, setToken] = useState('');
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [transitioning, setTransitioning] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [form, setForm] = useState<FormData>({
        nameFirst: '',
        nameLast: '',
        email: '',
        username: '',
        password: '',
        passwordConfirmation: '',
    });

    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { siteKey: recaptchaSiteKey } = useStoreState(
        (state) => state.settings.data!.recaptcha
    );
    const { provider: captchaProvider, siteKey: captchaSiteKey } = useStoreState(
        (state) => state.settings.data!.captcha
    );
    const registration = useStoreState((state) => state.settings.data!.registration);
    const oauth = useStoreState((state) => state.settings.data!.oauth);

    const turnstileRef = useRef<HTMLDivElement>(null);
    const turnstileWidgetId = useRef<string | null>(null);

    useEffect(() => {
        clearFlashes();
        if (!registration) {
            history.replace('/auth/login');
        }
    }, []);

    useEffect(() => {
        if (captchaProvider !== 'turnstile' || !captchaSiteKey) return;

        const scriptId = 'cf-turnstile-script';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        }

        const renderWidget = () => {
            if (turnstileRef.current && window.turnstile && !turnstileWidgetId.current) {
                turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
                    sitekey: captchaSiteKey,
                    callback: (response: string) => setToken(response),
                    'expired-callback': () => setToken(''),
                });
            }
        };

        const interval = setInterval(() => {
            if (window.turnstile) {
                renderWidget();
                clearInterval(interval);
            }
        }, 100);

        return () => {
            clearInterval(interval);
            if (turnstileWidgetId.current && window.turnstile) {
                window.turnstile.remove(turnstileWidgetId.current);
                turnstileWidgetId.current = null;
            }
        };
    }, [captchaProvider, captchaSiteKey]);

    const update = (field: keyof FormData, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const validateStep1 = (): boolean => {
        const e: Record<string, string> = {};
        if (!form.nameFirst.trim()) e.nameFirst = 'First name is required.';
        if (!form.nameLast.trim()) e.nameLast = 'Last name is required.';
        if (!form.email.trim()) e.email = 'Email is required.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const validateStep2 = (): boolean => {
        const e: Record<string, string> = {};
        if (!form.username.trim()) e.username = 'Username is required.';
        else if (form.username.length < 3) e.username = 'At least 3 characters.';
        else if (!/^[a-zA-Z0-9_.-]+$/.test(form.username)) e.username = 'Only letters, numbers, dots, dashes, underscores.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const validateStep3 = (): boolean => {
        const e: Record<string, string> = {};
        if (!form.password) e.password = 'Password is required.';
        else if (form.password.length < 8) e.password = 'At least 8 characters.';
        if (!form.passwordConfirmation) e.passwordConfirmation = 'Please confirm your password.';
        else if (form.password !== form.passwordConfirmation) e.passwordConfirmation = 'Passwords do not match.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const next = () => {
        if (step === 1 && validateStep1()) {
            setTransitioning(true);
            setTimeout(() => { setStep(2); setTransitioning(false); }, 600);
        } else if (step === 2 && validateStep2()) {
            setTransitioning(true);
            setTimeout(() => { setStep(3); setTransitioning(false); }, 600);
        }
    };

    const back = () => {
        setErrors({});
        setTransitioning(true);
        setTimeout(() => { setStep((s) => s - 1); setTransitioning(false); }, 400);
    };

    const submit = () => {
        if (!validateStep3()) return;
        clearFlashes();

        if (captchaProvider === 'recaptcha' && !token) {
            captchaRef.current!.execute().catch((error) => {
                console.error(error);
                clearAndAddHttpError({ error });
            });
            return;
        }

        if (captchaProvider === 'turnstile' && !token) {
            clearAndAddHttpError({ error: new Error('Please complete the CAPTCHA challenge.') });
            return;
        }

        setSubmitting(true);
        http.post('/auth/register', {
            name_first: form.nameFirst,
            name_last: form.nameLast,
            email: form.email,
            username: form.username,
            password: form.password,
            password_confirmation: form.passwordConfirmation,
            'g-recaptcha-response': captchaProvider === 'recaptcha' ? token : undefined,
            'cf-turnstile-response': captchaProvider === 'turnstile' ? token : undefined,
        })
            .then(() => {
                addFlash({ type: 'success', title: 'Success', message: 'Account created! Redirecting to login...' });
                setTimeout(() => history.push('/auth/login'), 2000);
            })
            .catch((error) => {
                console.error(error);
                setSubmitting(false);
                clearAndAddHttpError({ error });
            });
    };

    const inputClass = 'w-full h-10 px-3 rounded-lg border border-gray-700/50 bg-[#192024] text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed';

    return (
        <div className={'flex items-center justify-center min-h-screen'} style={{ backgroundColor: '#0b0f10' }}>
            <div className={'w-full max-w-md px-6'}>
                <div className={'mb-8'}>
                    <img
                        src={'https://cdn.ordnary.com/realmctl/logo.png'}
                        className={'h-8 mb-6'}
                        alt={'Logo'}
                        style={{ filter: 'brightness(0) invert(1)' }}
                    />
                    <h1 className={'text-xl font-semibold text-white'}>Create your account</h1>
                    <p className={'mt-2 text-sm text-gray-400'}>
                        Already have an account?{' '}
                        <Link to={'/auth/login'} className={'text-blue-400 hover:text-blue-300 no-underline'}>
                            Sign in
                        </Link>
                    </p>
                </div>

                {/* Step indicator */}
                <div className={'flex items-center gap-2 mb-6'}>
                    {[1, 2, 3].map((s) => (
                        <div
                            key={s}
                            className={'h-1 flex-1 rounded-full transition-colors duration-200'}
                            style={{ backgroundColor: s <= step ? '#3b82f6' : '#2a2d35' }}
                        />
                    ))}
                </div>

                <AuthToast />

                {/* Step 1: Name & Email */}
                {step === 1 && (
                    <div>
                        <p className={'text-sm text-gray-400 mb-4'}>Let&apos;s start with the basics.</p>
                        <div className={'grid grid-cols-2 gap-3 mb-4'}>
                            <div>
                                <label className={'block text-sm font-medium text-gray-300 mb-1.5'}>First Name</label>
                                <input
                                    type={'text'}
                                    autoComplete={'given-name'}
                                    placeholder={'John'}
                                    disabled={transitioning}
                                    value={form.nameFirst}
                                    onChange={(e) => update('nameFirst', e.target.value)}
                                    className={inputClass}
                                />
                                {errors.nameFirst && <p className={'mt-1 text-xs text-red-400'}>{errors.nameFirst}</p>}
                            </div>
                            <div>
                                <label className={'block text-sm font-medium text-gray-300 mb-1.5'}>Last Name</label>
                                <input
                                    type={'text'}
                                    autoComplete={'family-name'}
                                    placeholder={'Doe'}
                                    disabled={transitioning}
                                    value={form.nameLast}
                                    onChange={(e) => update('nameLast', e.target.value)}
                                    className={inputClass}
                                />
                                {errors.nameLast && <p className={'mt-1 text-xs text-red-400'}>{errors.nameLast}</p>}
                            </div>
                        </div>
                        <div className={'mb-6'}>
                            <label className={'block text-sm font-medium text-gray-300 mb-1.5'}>Email</label>
                            <input
                                type={'email'}
                                autoComplete={'email'}
                                placeholder={'you@example.com'}
                                disabled={transitioning}
                                value={form.email}
                                onChange={(e) => update('email', e.target.value)}
                                className={inputClass}
                            />
                            {errors.email && <p className={'mt-1 text-xs text-red-400'}>{errors.email}</p>}
                        </div>
                        <button
                            type={'button'}
                            onClick={next}
                            disabled={transitioning}
                            className={'w-full h-10 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 transition-colors flex items-center justify-center'}
                        >
                            {transitioning ? <Spinner /> : 'Continue'}
                        </button>

                        {/* Social sign-up */}
                        {(oauth?.google || oauth?.discord || oauth?.github) && (
                        <div className={'mt-6'}>
                            <div className={'flex items-center mb-4'}>
                                <div className={'flex-1 h-px bg-gray-700/50'} />
                                <span className={'px-3 text-xs text-gray-500 uppercase'}>or sign up with</span>
                                <div className={'flex-1 h-px bg-gray-700/50'} />
                            </div>
                            <div className={'flex gap-3'}>
                                {oauth.google && (
                                <a
                                    href={'/auth/oauth/google?register=1'}
                                    className={'flex-1 h-10 rounded-lg border border-gray-700/50 flex items-center justify-center hover:bg-[#192024] transition-colors no-underline'}
                                >
                                    <svg className={'w-5 h-5'} viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                    </svg>
                                </a>
                                )}
                                {oauth.discord && (
                                <a
                                    href={'/auth/oauth/discord?register=1'}
                                    className={'flex-1 h-10 rounded-lg border border-gray-700/50 flex items-center justify-center hover:bg-[#192024] transition-colors no-underline'}
                                >
                                    <svg className={'w-5 h-5'} viewBox="0 0 24 24" fill="#5865F2">
                                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                                    </svg>
                                </a>
                                )}
                                {oauth.github && (
                                <a
                                    href={'/auth/oauth/github?register=1'}
                                    className={'flex-1 h-10 rounded-lg border border-gray-700/50 flex items-center justify-center hover:bg-[#192024] transition-colors no-underline'}
                                >
                                    <svg className={'w-5 h-5 text-white'} viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                                    </svg>
                                </a>
                                )}
                            </div>
                        </div>
                        )}
                    </div>
                )}

                {/* Step 2: Username */}
                {step === 2 && (
                    <div>
                        <p className={'text-sm text-gray-400 mb-4'}>What would you like your @username to be?</p>
                        <div className={'mb-6'}>
                            <label className={'block text-sm font-medium text-gray-300 mb-1.5'}>Username</label>
                            <input
                                type={'text'}
                                autoComplete={'username'}
                                placeholder={'coolplayer123'}
                                autoFocus
                                disabled={transitioning}
                                value={form.username}
                                onChange={(e) => update('username', e.target.value)}
                                className={inputClass}
                            />
                            {errors.username && <p className={'mt-1 text-xs text-red-400'}>{errors.username}</p>}
                        </div>
                        <div className={'flex gap-3'}>
                            <button
                                type={'button'}
                                onClick={back}
                                disabled={transitioning}
                                className={'flex-1 h-10 rounded-lg border border-gray-700/50 text-gray-300 text-sm font-medium hover:bg-[#192024] transition-colors disabled:opacity-50'}
                            >
                                Back
                            </button>
                            <button
                                type={'button'}
                                onClick={next}
                                disabled={transitioning}
                                className={'flex-1 h-10 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 transition-colors flex items-center justify-center'}
                            >
                                {transitioning ? <Spinner /> : 'Continue'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Password */}
                {step === 3 && (
                    <div>
                        <p className={'text-sm text-gray-400 mb-4'}>Last step — secure your account.</p>
                        <div className={'mb-4'}>
                            <label className={'block text-sm font-medium text-gray-300 mb-1.5'}>Password</label>
                            <input
                                type={'password'}
                                autoComplete={'new-password'}
                                placeholder={'••••••••'}
                                autoFocus
                                value={form.password}
                                onChange={(e) => update('password', e.target.value)}
                                className={inputClass}
                            />
                            {errors.password && <p className={'mt-1 text-xs text-red-400'}>{errors.password}</p>}
                        </div>
                        <div className={'mb-6'}>
                            <label className={'block text-sm font-medium text-gray-300 mb-1.5'}>Confirm Password</label>
                            <input
                                type={'password'}
                                autoComplete={'new-password'}
                                placeholder={'••••••••'}
                                value={form.passwordConfirmation}
                                onChange={(e) => update('passwordConfirmation', e.target.value)}
                                className={inputClass}
                            />
                            {errors.passwordConfirmation && <p className={'mt-1 text-xs text-red-400'}>{errors.passwordConfirmation}</p>}
                        </div>
                        <div className={'flex gap-3'}>
                            <button
                                type={'button'}
                                onClick={back}
                                disabled={submitting}
                                className={'flex-1 h-10 rounded-lg border border-gray-700/50 text-gray-300 text-sm font-medium hover:bg-[#192024] transition-colors disabled:opacity-50'}
                            >
                                Back
                            </button>
                            <button
                                type={'button'}
                                onClick={submit}
                                disabled={submitting}
                                className={'flex-1 h-10 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'}
                            >
                                {submitting ? 'Creating...' : 'Create account'}
                            </button>
                        </div>

                        {captchaProvider === 'recaptcha' && (
                            <Reaptcha
                                ref={captchaRef}
                                size={'invisible'}
                                sitekey={recaptchaSiteKey || captchaSiteKey || '_invalid_key'}
                                onVerify={(response) => {
                                    setToken(response);
                                    submit();
                                }}
                                onExpire={() => setToken('')}
                            />
                        )}
                        {captchaProvider === 'turnstile' && (
                            <div className={'mt-4 flex justify-center'}>
                                <div ref={turnstileRef} />
                            </div>
                        )}
                    </div>
                )}
            </div>

            <AuthFooter />
        </div>
    );
};

export default RegisterContainer;
