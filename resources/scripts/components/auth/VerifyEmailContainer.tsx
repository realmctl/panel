import React, { useEffect, useRef, useState } from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import { useStoreState } from 'easy-peasy';
import Reaptcha from 'reaptcha';
import verifyEmail from '@/api/auth/verifyEmail';
import resendVerificationEmail from '@/api/auth/resendVerificationEmail';
import { httpErrorToHuman } from '@/api/http';

type Status = 'verifying' | 'success' | 'error';

export default ({ match, location }: RouteComponentProps<{ id: string; hash: string }>) => {
    const [status, setStatus] = useState<Status>('verifying');
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [resendToken, setResendToken] = useState('');
    const [resendError, setResendError] = useState('');
    const [resent, setResent] = useState(false);
    const captchaRef = useRef<Reaptcha>(null);

    const { provider: captchaProvider, siteKey: captchaSiteKey } = useStoreState(
        (state) => state.settings.data!.captcha
    );
    const { siteKey: recaptchaSiteKey } = useStoreState((state) => state.settings.data!.recaptcha);

    const turnstileRef = useRef<HTMLDivElement>(null);
    const turnstileWidgetId = useRef<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(location.search);

        verifyEmail({
            id: match.params.id,
            hash: match.params.hash,
            expires: params.get('expires'),
            signature: params.get('signature'),
        })
            .then((responseMessage) => {
                setStatus('success');
                setMessage(responseMessage);
            })
            .catch((error) => {
                setStatus('error');
                setMessage(httpErrorToHuman(error));
            });
    }, []);

    useEffect(() => {
        if (status !== 'error' || captchaProvider !== 'turnstile' || !captchaSiteKey) return;

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
                    callback: (response: string) => setResendToken(response),
                    'expired-callback': () => setResendToken(''),
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
    }, [status, captchaProvider, captchaSiteKey]);

    const sendResendRequest = (token: string) => {
        resendVerificationEmail(email, token, captchaProvider)
            .then(() => setResent(true))
            .catch((error) => {
                console.error(error);
                setResendError(httpErrorToHuman(error));
            });
    };

    const submitResend = () => {
        if (!email) return;
        setResendError('');

        if (captchaProvider === 'recaptcha' && !resendToken) {
            captchaRef.current!.execute().catch((error) => {
                console.error(error);
                setResendError(httpErrorToHuman(error));
            });
            return;
        }

        if (captchaProvider === 'turnstile' && !resendToken) {
            setResendError('Please complete the CAPTCHA challenge.');
            return;
        }

        sendResendRequest(resendToken);
    };

    return (
        <div className={'flex items-center justify-center min-h-screen'} style={{ backgroundColor: '#0b0f10' }}>
            <div className={'w-full max-w-md px-6'}>
                <div className={'mb-8'}>
                    <h1 className={'text-xl font-semibold text-white'}>Verify your email</h1>
                </div>

                {status === 'verifying' && (
                    <p className={'text-sm text-gray-400'}>Verifying your email address...</p>
                )}

                {status === 'success' && (
                    <div>
                        <p className={'text-sm text-green-400 mb-6'}>{message}</p>
                        <Link
                            to={'/auth/login'}
                            className={'inline-flex h-10 items-center justify-center w-full rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 no-underline transition-colors'}
                        >
                            Go to Login
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div>
                        <p className={'text-sm text-red-400 mb-6'}>{message}</p>

                        {resent ? (
                            <p className={'text-sm text-gray-400'}>
                                If an account exists with that email address, a new verification link is on its way.
                            </p>
                        ) : (
                            <>
                                <p className={'text-sm text-gray-400 mb-4'}>
                                    This link may have expired. Enter your email to request a new one.
                                </p>
                                <div className={'mb-4'}>
                                    <input
                                        type={'email'}
                                        placeholder={'you@example.com'}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={'w-full h-10 px-3 rounded-lg border border-gray-700/50 bg-[#192024] text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}
                                    />
                                    {resendError && <p className={'mt-1 text-xs text-red-400'}>{resendError}</p>}
                                </div>
                                <button
                                    type={'button'}
                                    onClick={submitResend}
                                    className={'w-full h-10 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors'}
                                >
                                    Resend verification email
                                </button>
                                {captchaProvider === 'recaptcha' && (
                                    <Reaptcha
                                        ref={captchaRef}
                                        size={'invisible'}
                                        sitekey={recaptchaSiteKey || captchaSiteKey || '_invalid_key'}
                                        onVerify={(response) => {
                                            setResendToken(response);
                                            sendResendRequest(response);
                                        }}
                                        onExpire={() => setResendToken('')}
                                    />
                                )}
                                {captchaProvider === 'turnstile' && (
                                    <div className={'mt-4 flex justify-center'}>
                                        <div ref={turnstileRef} />
                                    </div>
                                )}
                            </>
                        )}

                        <p className={'mt-6 text-sm text-center text-gray-400'}>
                            <Link to={'/auth/login'} className={'font-medium text-blue-400 hover:text-blue-300 no-underline'}>
                                Return to Login
                            </Link>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
