import React, { useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';
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

const OAuthCompleteContainer = ({ history }: RouteComponentProps) => {
    const [username, setUsername] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();

    const submit = () => {
        setError('');
        if (!username.trim()) {
            setError('Username is required.');
            return;
        }
        if (username.length < 3) {
            setError('At least 3 characters.');
            return;
        }
        if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
            setError('Only letters, numbers, dots, dashes, underscores.');
            return;
        }

        clearFlashes();
        setSubmitting(true);

        http.post('/auth/oauth/complete', { username })
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

    const inputClass = 'w-full h-10 px-3 rounded-lg border border-gray-700/50 bg-[#1a1d25] text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed';

    return (
        <div className={'flex items-center justify-center min-h-screen'} style={{ backgroundColor: '#0f1117' }}>
            <div className={'w-full max-w-md px-6'}>
                <div className={'mb-8'}>
                    <img
                        src={'https://cdn.ordnary.com/realmctl/logo.png'}
                        className={'h-8 mb-6'}
                        alt={'Logo'}
                        style={{ filter: 'brightness(0) invert(1)' }}
                    />
                    <h1 className={'text-xl font-semibold text-white'}>Almost there!</h1>
                    <p className={'mt-2 text-sm text-gray-400'}>
                        Just pick a username and you&apos;re good to go.
                    </p>
                </div>

                <AuthToast />

                <div className={'mb-6'}>
                    <label className={'block text-sm font-medium text-gray-300 mb-1.5'}>Username</label>
                    <input
                        type={'text'}
                        autoComplete={'username'}
                        placeholder={'coolplayer123'}
                        autoFocus
                        disabled={submitting}
                        value={username}
                        onChange={(e) => { setUsername(e.target.value); setError(''); }}
                        className={inputClass}
                    />
                    {error && <p className={'mt-1 text-xs text-red-400'}>{error}</p>}
                </div>

                <button
                    type={'button'}
                    onClick={submit}
                    disabled={submitting}
                    className={'w-full h-10 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center'}
                >
                    {submitting ? <Spinner /> : 'Complete registration'}
                </button>
            </div>

            <AuthFooter />
        </div>
    );
};

export default OAuthCompleteContainer;
