import React, { useEffect, useRef, useState } from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import login from '@/api/auth/login';
import { useStoreState } from 'easy-peasy';
import { Formik, FormikHelpers } from 'formik';
import { object, string } from 'yup';
import Reaptcha from 'reaptcha';
import useFlash from '@/plugins/useFlash';
import AuthToast from '@/components/auth/AuthToast';
import AuthFooter from '@/components/auth/AuthFooter';

interface Values {
    username: string;
    password: string;
}

const LoginContainer = ({ history }: RouteComponentProps) => {
    const ref = useRef<Reaptcha>(null);
    const [token, setToken] = useState('');

    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { siteKey: recaptchaSiteKey } = useStoreState(
        (state) => state.settings.data!.recaptcha
    );
    const { provider: captchaProvider, siteKey: captchaSiteKey } = useStoreState(
        (state) => state.settings.data!.captcha
    );
    const name = useStoreState((state) => state.settings.data!.name);
    const oauth = useStoreState((state) => state.settings.data!.oauth);
    const registration = useStoreState((state) => state.settings.data!.registration);

    const turnstileRef = useRef<HTMLDivElement>(null);
    const turnstileWidgetId = useRef<string | null>(null);

    useEffect(() => {
        clearFlashes();
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
                    callback: (response: string) => {
                        setToken(response);
                    },
                    'expired-callback': () => {
                        setToken('');
                    },
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

    const resetCaptcha = () => {
        setToken('');
        if (captchaProvider === 'recaptcha' && ref.current) {
            ref.current.reset();
        } else if (captchaProvider === 'turnstile' && turnstileWidgetId.current && window.turnstile) {
            window.turnstile.reset(turnstileWidgetId.current);
        }
    };

    const onSubmit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes();

        if (captchaProvider === 'recaptcha' && !token) {
            ref.current!.execute().catch((error) => {
                console.error(error);
                setSubmitting(false);
                clearAndAddHttpError({ error });
            });
            return;
        }

        if (captchaProvider === 'turnstile' && !token) {
            setSubmitting(false);
            clearAndAddHttpError({ error: new Error('Please complete the CAPTCHA challenge.') });
            return;
        }

        login({
            ...values,
            recaptchaData: captchaProvider === 'recaptcha' ? token : null,
            turnstileData: captchaProvider === 'turnstile' ? token : null,
        })
            .then((response) => {
                if (response.complete) {
                    // @ts-expect-error this is valid
                    window.location = response.intended || '/';
                    return;
                }

                history.replace('/auth/login/checkpoint', { token: response.confirmationToken });
            })
            .catch((error) => {
                console.error(error);
                resetCaptcha();
                setSubmitting(false);
                clearAndAddHttpError({ error });
            });
    };

    return (
        <div className={'flex items-center justify-center min-h-screen'} style={{ backgroundColor: '#0f1117' }}>
            <div className={'w-full max-w-md px-6'}>
                <div className={'mb-8'}>
                    <img
                        src={'https://cdn.ordnary.com/realmctl/logo.png'}
                        className={'h-8 mb-6'}
                        alt={name}
                        style={{ filter: 'brightness(0) invert(1)' }}
                    />
                    <h1 className={'text-xl font-semibold text-white'}>Ready to jump back in?</h1>
                    <p className={'mt-2 text-sm text-gray-400'}>
                        {registration
                            ? <>New here? <Link to={'/auth/register'} className={'text-blue-400 hover:text-blue-300 no-underline'}>Create an account</Link> and get started.</>
                            : 'Your servers are waiting. Sign in to take control.'
                        }
                    </p>
                </div>

                <AuthToast />

                <Formik
                    onSubmit={onSubmit}
                    initialValues={{ username: '', password: '' }}
                    validationSchema={object().shape({
                        username: string().required('A username or email must be provided.'),
                        password: string().required('Please enter your account password.'),
                    })}
                >
                    {({ isSubmitting, setSubmitting, submitForm, handleSubmit, handleChange, handleBlur, values, errors, touched }) => (
                        <form onSubmit={handleSubmit}>
                            <div className={'mb-4'}>
                                <label
                                    htmlFor={'username-login'}
                                    className={'block text-sm font-medium text-gray-300 mb-1.5'}
                                >
                                    Username or Email
                                </label>
                                <input
                                    type={'text'}
                                    id={'username-login'}
                                    name={'username'}
                                    autoComplete={'username'}
                                    placeholder={'you@example.com'}
                                    disabled={isSubmitting}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    value={values.username}
                                    className={'w-full h-10 px-3 rounded-lg border border-gray-700/50 bg-[#1a1d25] text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'}
                                />
                                {touched.username && errors.username && (
                                    <p className={'mt-1 text-xs text-red-400'}>{errors.username}</p>
                                )}
                            </div>

                            <div className={'mb-6'}>
                                <label
                                    htmlFor={'password-login'}
                                    className={'block text-sm font-medium text-gray-300 mb-1.5'}
                                >
                                    Password
                                </label>
                                <input
                                    type={'password'}
                                    id={'password-login'}
                                    name={'password'}
                                    autoComplete={'current-password'}
                                    placeholder={'••••••••'}
                                    disabled={isSubmitting}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    value={values.password}
                                    className={'w-full h-10 px-3 rounded-lg border border-gray-700/50 bg-[#1a1d25] text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'}
                                />
                                {touched.password && errors.password && (
                                    <p className={'mt-1 text-xs text-red-400'}>{errors.password}</p>
                                )}
                            </div>

                            <button
                                type={'submit'}
                                disabled={isSubmitting}
                                className={'w-full h-10 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'}
                            >
                                {isSubmitting ? 'Signing in...' : 'Sign in'}
                            </button>

                            {captchaProvider === 'recaptcha' && (
                                <Reaptcha
                                    ref={ref}
                                    size={'invisible'}
                                    sitekey={recaptchaSiteKey || captchaSiteKey || '_invalid_key'}
                                    onVerify={(response) => {
                                        setToken(response);
                                        submitForm();
                                    }}
                                    onExpire={() => {
                                        setSubmitting(false);
                                        setToken('');
                                    }}
                                />
                            )}
                            {captchaProvider === 'turnstile' && (
                                <div className={'mt-4 flex justify-center'}>
                                    <div ref={turnstileRef} />
                                </div>
                            )}
                        </form>
                    )}
                </Formik>

                {(oauth?.google || oauth?.discord || oauth?.github) && (
                    <div className={'mt-6'}>
                        <div className={'flex items-center mb-4'}>
                            <div className={'flex-1 h-px bg-gray-700/50'} />
                            <span className={'px-3 text-xs text-gray-500 uppercase'}>or continue with</span>
                            <div className={'flex-1 h-px bg-gray-700/50'} />
                        </div>
                        <div className={'flex gap-3'}>
                            <a
                                href={'/auth/oauth/google'}
                                className={'flex-1 h-10 rounded-lg border border-gray-700/50 flex items-center justify-center hover:bg-[#1a1d25] transition-colors no-underline'}
                                style={{ backgroundColor: 'transparent' }}
                            >
                                <svg className={'w-5 h-5'} viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                            </a>
                            <a
                                href={'/auth/oauth/discord'}
                                className={'flex-1 h-10 rounded-lg border border-gray-700/50 flex items-center justify-center hover:bg-[#1a1d25] transition-colors no-underline'}
                                style={{ backgroundColor: 'transparent' }}
                            >
                                <svg className={'w-5 h-5'} viewBox="0 0 24 24" fill="#5865F2">
                                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                                </svg>
                            </a>
                            <a
                                href={'/auth/oauth/github'}
                                className={'flex-1 h-10 rounded-lg border border-gray-700/50 flex items-center justify-center hover:bg-[#1a1d25] transition-colors no-underline'}
                                style={{ backgroundColor: 'transparent' }}
                            >
                                <svg className={'w-5 h-5 text-white'} viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                                </svg>
                            </a>
                        </div>
                    </div>
                )}

                <p className={'mt-6 text-sm'}>
                    <Link
                        to={'/auth/password'}
                        className={'text-blue-400 hover:text-blue-300 no-underline'}
                    >
                        Forgot your password?
                    </Link>
                </p>
            </div>

            {/* Footer */}
            <AuthFooter />
        </div>
    );
};

export default LoginContainer;
