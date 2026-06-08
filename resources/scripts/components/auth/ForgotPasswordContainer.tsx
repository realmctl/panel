import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import requestPasswordResetEmail from '@/api/auth/requestPasswordResetEmail';
import { httpErrorToHuman } from '@/api/http';
import { useStoreState } from 'easy-peasy';
import { Formik, FormikHelpers } from 'formik';
import { object, string } from 'yup';
import Reaptcha from 'reaptcha';
import useFlash from '@/plugins/useFlash';
import FlashMessageRender from '@/components/FlashMessageRender';

interface Values {
    email: string;
}

export default () => {
    const ref = useRef<Reaptcha>(null);
    const [token, setToken] = useState('');

    const { clearFlashes, addFlash } = useFlash();
    const { siteKey: recaptchaSiteKey } = useStoreState(
        (state) => state.settings.data!.recaptcha
    );
    const { provider: captchaProvider, siteKey: captchaSiteKey } = useStoreState(
        (state) => state.settings.data!.captcha
    );

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

    const handleSubmission = ({ email }: Values, { setSubmitting, resetForm }: FormikHelpers<Values>) => {
        clearFlashes();

        if (captchaProvider === 'recaptcha' && !token) {
            ref.current!.execute().catch((error) => {
                console.error(error);
                setSubmitting(false);
                addFlash({ type: 'error', title: 'Error', message: httpErrorToHuman(error) });
            });
            return;
        }

        if (captchaProvider === 'turnstile' && !token) {
            setSubmitting(false);
            addFlash({ type: 'error', title: 'Error', message: 'Please complete the CAPTCHA challenge.' });
            return;
        }

        requestPasswordResetEmail(email, token, captchaProvider)
            .then((response) => {
                resetForm();
                addFlash({ type: 'success', title: 'Success', message: response });
            })
            .catch((error) => {
                console.error(error);
                addFlash({ type: 'error', title: 'Error', message: httpErrorToHuman(error) });
            })
            .then(() => {
                resetCaptcha();
                setSubmitting(false);
            });
    };

    return (
        <div className={'flex items-center justify-center min-h-screen'} style={{ backgroundColor: '#0b0f10' }}>
            <div className={'w-full max-w-md px-6'}>
                <div className={'mb-8'}>
                    <h1 className={'text-xl font-semibold text-white'}>Reset your password</h1>
                    <p className={'mt-2 text-sm text-gray-400'}>
                        Enter your email address and we&apos;ll send you instructions to reset your password.
                    </p>
                </div>

                <Formik
                    onSubmit={handleSubmission}
                    initialValues={{ email: '' }}
                    validationSchema={object().shape({
                        email: string()
                            .email('A valid email address must be provided to continue.')
                            .required('A valid email address must be provided to continue.'),
                    })}
                >
                    {({ isSubmitting, setSubmitting, submitForm, handleSubmit, handleChange, handleBlur, values, errors, touched }) => (
                        <form onSubmit={handleSubmit}>
                            <div className={'mb-6'}>
                                <label
                                    htmlFor={'email-forgot'}
                                    className={'block text-sm font-medium text-gray-300 mb-1.5'}
                                >
                                    Email Address
                                </label>
                                <input
                                    type={'email'}
                                    id={'email-forgot'}
                                    name={'email'}
                                    autoComplete={'email'}
                                    placeholder={'you@example.com'}
                                    disabled={isSubmitting}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    value={values.email}
                                    className={'w-full h-10 px-3 rounded-lg border border-gray-700/50 bg-[#192024] text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'}
                                />
                                {touched.email && errors.email && (
                                    <p className={'mt-1 text-xs text-red-400'}>{errors.email}</p>
                                )}
                            </div>

                            <button
                                type={'submit'}
                                disabled={isSubmitting}
                                className={'w-full h-10 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'}
                            >
                                {isSubmitting ? 'Sending...' : 'Send Reset Email'}
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

                <p className={'mt-6 text-sm text-center text-gray-400'}>
                    <Link
                        to={'/auth/login'}
                        className={'font-medium text-blue-400 hover:text-blue-300 no-underline'}
                    >
                        Return to Login
                    </Link>
                </p>
            </div>
        </div>
    );
};
