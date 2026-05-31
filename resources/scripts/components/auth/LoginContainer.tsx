import React, { useEffect, useRef, useState } from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import login from '@/api/auth/login';
import { useStoreState } from 'easy-peasy';
import { Formik, FormikHelpers } from 'formik';
import { object, string } from 'yup';
import Reaptcha from 'reaptcha';
import useFlash from '@/plugins/useFlash';
import AuthToast from '@/components/auth/AuthToast';

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
                        Your servers are waiting. Sign in to take control.
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

                <p className={'mt-6 text-sm'}>
                    <Link
                        to={'/auth/password'}
                        className={'text-blue-400 hover:text-blue-300 no-underline'}
                    >
                        Forgot your password?
                    </Link>
                </p>
            </div>

            {/* Copyright */}
            <div className={'fixed bottom-4 left-4'}>
                <p className={'text-xs text-gray-600'}>
                    &copy; {new Date().getFullYear()} Realm Software
                </p>
            </div>

            {/* Version info */}
            <div className={'fixed bottom-4 right-4'}>
                <p className={'text-xs text-gray-600'}>
                    {name} &middot; {(process.env.WEBPACK_BUILD_HASH || 'dev').slice(0, 7)}
                </p>
            </div>
        </div>
    );
};

export default LoginContainer;
