import React, { useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import useFlash from '@/plugins/useFlash';
import http from '@/api/http';
import { REALM_LOGO } from '@/lib/branding';

const Spinner = () => (
    <svg className={'animate-spin h-4 w-4 text-white'} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className={'opacity-25'} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className={'opacity-75'} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
);

interface CompletionNeeds {
    needs_username: boolean;
    needs_name: boolean;
    email: string;
    provider: string;
}

const OAuthCompleteContainer = ({ history }: RouteComponentProps) => {
    const [needs, setNeeds] = useState<CompletionNeeds | null>(null);
    const [step, setStep] = useState(1);
    const [username, setUsername] = useState('');
    const [nameFirst, setNameFirst] = useState('');
    const [nameLast, setNameLast] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [transitioning, setTransitioning] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();

    useEffect(() => {
        http.get('/auth/oauth/complete/status')
            .then(({ data }) => {
                setNeeds(data);
                // If only username is needed, start at username step
                // If name is needed, start at name step
                if (data.needs_name) {
                    setStep(1); // name first
                } else {
                    setStep(2); // skip to username
                }
            })
            .catch(() => {
                history.replace('/auth/login');
            });
    }, []);

    const totalSteps = (needs?.needs_name ? 1 : 0) + (needs?.needs_username ? 1 : 0);

    const validateName = (): boolean => {
        const e: Record<string, string> = {};
        if (!nameFirst.trim()) e.nameFirst = 'First name is required.';
        if (!nameLast.trim()) e.nameLast = 'Last name is required.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const validateUsername = (): boolean => {
        const e: Record<string, string> = {};
        if (!username.trim()) e.username = 'Username is required.';
        else if (username.length < 3) e.username = 'At least 3 characters.';
        else if (!/^[a-zA-Z0-9_.-]+$/.test(username)) e.username = 'Only letters, numbers, dots, dashes, underscores.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const next = () => {
        if (step === 1 && needs?.needs_name) {
            if (!validateName()) return;
            if (needs.needs_username) {
                setTransitioning(true);
                setTimeout(() => { setStep(2); setTransitioning(false); }, 500);
            } else {
                submit();
            }
        } else if (step === 2 && needs?.needs_username) {
            if (!validateUsername()) return;
            submit();
        }
    };

    const back = () => {
        setErrors({});
        setTransitioning(true);
        setTimeout(() => { setStep(1); setTransitioning(false); }, 400);
    };

    const submit = () => {
        if (needs?.needs_username && !validateUsername()) return;
        clearFlashes();
        setSubmitting(true);

        const data: Record<string, string> = {};
        if (needs?.needs_username) data.username = username;
        if (needs?.needs_name) {
            data.name_first = nameFirst;
            data.name_last = nameLast;
        }

        http.post('/auth/oauth/complete', data)
            .then(() => {
                addFlash({ type: 'success', title: 'Success', message: 'Account created! Redirecting...' });
                setTimeout(() => {
                    // @ts-expect-error this is valid
                    window.location = '/';
                }, 1500);
            })
            .catch((err) => {
                console.error(err);
                setSubmitting(false);
                clearAndAddHttpError({ error: err });
            });
    };

    const inputClass = 'w-full h-10 px-3 rounded-lg border border-gray-700/50 bg-[#192024] text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed';

    if (!needs) {
        return (
            <div className={'flex items-center justify-center min-h-screen'} style={{ backgroundColor: '#0b0f10' }}>
                <Spinner />
            </div>
        );
    }

    // Calculate current visual step for progress bar
    const currentVisualStep = needs.needs_name ? step : 1;

    return (
        <div className={'flex items-center justify-center min-h-screen'} style={{ backgroundColor: '#0b0f10' }}>
            <div className={'w-full max-w-md px-6'}>
                <div className={'mb-8'}>
                    <img
                        src={REALM_LOGO}
                        className={'h-8 mb-6'}
                        alt={'Logo'}
                        style={{ filter: 'brightness(0) invert(1)' }}
                    />
                    <h1 className={'text-xl font-semibold text-white'}>Almost there!</h1>
                    <p className={'mt-2 text-sm text-gray-400'}>
                        We just need a few more details to set up your account.
                    </p>
                </div>

                {/* Progress bar */}
                {totalSteps > 1 && (
                    <div className={'flex items-center gap-2 mb-6'}>
                        {Array.from({ length: totalSteps }).map((_, i) => (
                            <div
                                key={i}
                                className={'h-1 flex-1 rounded-full transition-colors duration-200'}
                                style={{ backgroundColor: i < currentVisualStep ? '#3b82f6' : '#2a2d35' }}
                            />
                        ))}
                    </div>
                )}

                {/* Step 1: Name (only if needed) */}
                {step === 1 && needs.needs_name && (
                    <div>
                        <p className={'text-sm text-gray-400 mb-4'}>What&apos;s your name?</p>
                        <div className={'grid grid-cols-2 gap-3 mb-6'}>
                            <div>
                                <label className={'block text-sm font-medium text-gray-300 mb-1.5'}>First Name</label>
                                <input
                                    type={'text'}
                                    autoComplete={'given-name'}
                                    placeholder={'John'}
                                    autoFocus
                                    disabled={transitioning || submitting}
                                    value={nameFirst}
                                    onChange={(e) => { setNameFirst(e.target.value); setErrors({}); }}
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
                                    disabled={transitioning || submitting}
                                    value={nameLast}
                                    onChange={(e) => { setNameLast(e.target.value); setErrors({}); }}
                                    className={inputClass}
                                />
                                {errors.nameLast && <p className={'mt-1 text-xs text-red-400'}>{errors.nameLast}</p>}
                            </div>
                        </div>
                        <button
                            type={'button'}
                            onClick={next}
                            disabled={transitioning || submitting}
                            className={'w-full h-10 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 transition-colors flex items-center justify-center'}
                        >
                            {transitioning || submitting ? <Spinner /> : (needs.needs_username ? 'Continue' : 'Complete')}
                        </button>
                    </div>
                )}

                {/* Step 2: Username (only if needed) */}
                {step === 2 && needs.needs_username && (
                    <div>
                        <p className={'text-sm text-gray-400 mb-4'}>What would you like your @username to be?</p>
                        <div className={'mb-6'}>
                            <label className={'block text-sm font-medium text-gray-300 mb-1.5'}>Username</label>
                            <input
                                type={'text'}
                                autoComplete={'username'}
                                placeholder={'coolplayer123'}
                                autoFocus
                                disabled={transitioning || submitting}
                                value={username}
                                onChange={(e) => { setUsername(e.target.value); setErrors({}); }}
                                className={inputClass}
                            />
                            {errors.username && <p className={'mt-1 text-xs text-red-400'}>{errors.username}</p>}
                        </div>
                        <div className={'flex gap-3'}>
                            {needs.needs_name && (
                                <button
                                    type={'button'}
                                    onClick={back}
                                    disabled={transitioning || submitting}
                                    className={'flex-1 h-10 rounded-lg border border-gray-700/50 text-gray-300 text-sm font-medium hover:bg-[#192024] transition-colors disabled:opacity-50'}
                                >
                                    Back
                                </button>
                            )}
                            <button
                                type={'button'}
                                onClick={next}
                                disabled={transitioning || submitting}
                                className={`${needs.needs_name ? 'flex-1' : 'w-full'} h-10 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 transition-colors flex items-center justify-center`}
                            >
                                {submitting ? <Spinner /> : 'Complete'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OAuthCompleteContainer;
