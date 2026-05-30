import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import requestPasswordResetEmail from '@/api/auth/requestPasswordResetEmail';
import { httpErrorToHuman } from '@/api/http';
import LoginFormContainer from '@/components/auth/LoginFormContainer';
import { useStoreState } from 'easy-peasy';
import Field from '@/components/elements/Field';
import { Formik, FormikHelpers } from 'formik';
import { object, string } from 'yup';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';
import Reaptcha from 'reaptcha';
import useFlash from '@/plugins/useFlash';

interface Values {
    email: string;
}

export default () => {
    const ref = useRef<Reaptcha>(null);
    const [token, setToken] = useState('');

    const { clearFlashes, addFlash } = useFlash();
    const { enabled: recaptchaEnabled, siteKey: recaptchaSiteKey } = useStoreState(
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

    // Load Turnstile script and render widget when provider is turnstile.
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

        // For reCAPTCHA: if there is no token yet, execute the invisible challenge.
        if (captchaProvider === 'recaptcha' && !token) {
            ref.current!.execute().catch((error) => {
                console.error(error);
                setSubmitting(false);
                addFlash({ type: 'error', title: 'Error', message: httpErrorToHuman(error) });
            });
            return;
        }

        // For Turnstile: the widget is visible and the token should already be set.
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
        <Formik
            onSubmit={handleSubmission}
            initialValues={{ email: '' }}
            validationSchema={object().shape({
                email: string()
                    .email('A valid email address must be provided to continue.')
                    .required('A valid email address must be provided to continue.'),
            })}
        >
            {({ isSubmitting, setSubmitting, submitForm }) => (
                <LoginFormContainer title={'Request Password Reset'} css={tw`w-full flex`}>
                    <Field
                        light
                        label={'Email'}
                        description={
                            'Enter your account email address to receive instructions on resetting your password.'
                        }
                        name={'email'}
                        type={'email'}
                    />
                    <div css={tw`mt-6`}>
                        <Button type={'submit'} size={'xlarge'} disabled={isSubmitting} isLoading={isSubmitting}>
                            Send Email
                        </Button>
                    </div>
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
                        <div css={tw`mt-4 flex justify-center`}>
                            <div ref={turnstileRef} />
                        </div>
                    )}
                    <div css={tw`mt-6 text-center`}>
                        <Link
                            to={'/auth/login'}
                            css={tw`text-xs text-neutral-500 tracking-wide uppercase no-underline hover:text-neutral-700`}
                        >
                            Return to Login
                        </Link>
                    </div>
                </LoginFormContainer>
            )}
        </Formik>
    );
};
