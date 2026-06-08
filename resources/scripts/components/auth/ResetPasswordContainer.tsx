import React, { useState } from 'react';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import performPasswordReset from '@/api/auth/performPasswordReset';
import { httpErrorToHuman } from '@/api/http';
import { Actions, useStoreActions } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { Formik, FormikHelpers } from 'formik';
import { object, ref, string } from 'yup';
import FlashMessageRender from '@/components/FlashMessageRender';

interface Values {
    password: string;
    passwordConfirmation: string;
}

export default ({ match, location }: RouteComponentProps<{ token: string }>) => {
    const [email, setEmail] = useState('');

    const { clearFlashes, addFlash } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const parsed = new URLSearchParams(location.search);
    if (email.length === 0 && parsed.get('email')) {
        setEmail(parsed.get('email') || '');
    }

    const submit = ({ password, passwordConfirmation }: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes();
        performPasswordReset(email, { token: match.params.token, password, passwordConfirmation })
            .then(() => {
                // @ts-expect-error this is valid
                window.location = '/';
            })
            .catch((error) => {
                console.error(error);
                setSubmitting(false);
                addFlash({ type: 'error', title: 'Error', message: httpErrorToHuman(error) });
            });
    };

    return (
        <div className={'flex items-center justify-center min-h-screen'} style={{ backgroundColor: '#0b0f10' }}>
            <div className={'w-full max-w-md px-6'}>
                <div className={'mb-8'}>
                    <h1 className={'text-xl font-semibold text-white'}>Reset Password</h1>
                    <p className={'mt-2 text-sm text-gray-400'}>
                        Enter your new password below.
                    </p>
                </div>

                <Formik
                    onSubmit={submit}
                    initialValues={{
                        password: '',
                        passwordConfirmation: '',
                    }}
                    validationSchema={object().shape({
                        password: string()
                            .required('A new password is required.')
                            .min(8, 'Your new password should be at least 8 characters in length.'),
                        passwordConfirmation: string()
                            .required('Your new password does not match.')
                            // @ts-expect-error this is valid
                            .oneOf([ref('password'), null], 'Your new password does not match.'),
                    })}
                >
                    {({ isSubmitting, handleSubmit, handleChange, handleBlur, values, errors, touched }) => (
                        <form onSubmit={handleSubmit}>
                            <div className={'mb-4'}>
                                <label
                                    htmlFor={'email-reset'}
                                    className={'block text-sm font-medium text-gray-300 mb-1.5'}
                                >
                                    Email
                                </label>
                                <input
                                    type={'email'}
                                    id={'email-reset'}
                                    value={email}
                                    disabled
                                    className={'w-full h-10 px-3 rounded-lg border border-gray-700/50 bg-[#192024] text-sm text-gray-400 disabled:opacity-60 disabled:cursor-not-allowed'}
                                />
                            </div>

                            <div className={'mb-4'}>
                                <label
                                    htmlFor={'password-reset'}
                                    className={'block text-sm font-medium text-gray-300 mb-1.5'}
                                >
                                    New Password
                                </label>
                                <input
                                    type={'password'}
                                    id={'password-reset'}
                                    name={'password'}
                                    autoComplete={'new-password'}
                                    placeholder={'••••••••'}
                                    disabled={isSubmitting}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    value={values.password}
                                    className={'w-full h-10 px-3 rounded-lg border border-gray-700/50 bg-[#192024] text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'}
                                />
                                {touched.password && errors.password && (
                                    <p className={'mt-1 text-xs text-red-400'}>{errors.password}</p>
                                )}
                                <p className={'mt-1 text-xs text-gray-500'}>Passwords must be at least 8 characters in length.</p>
                            </div>

                            <div className={'mb-6'}>
                                <label
                                    htmlFor={'password-confirm-reset'}
                                    className={'block text-sm font-medium text-gray-300 mb-1.5'}
                                >
                                    Confirm New Password
                                </label>
                                <input
                                    type={'password'}
                                    id={'password-confirm-reset'}
                                    name={'passwordConfirmation'}
                                    autoComplete={'new-password'}
                                    placeholder={'••••••••'}
                                    disabled={isSubmitting}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    value={values.passwordConfirmation}
                                    className={'w-full h-10 px-3 rounded-lg border border-gray-700/50 bg-[#192024] text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'}
                                />
                                {touched.passwordConfirmation && errors.passwordConfirmation && (
                                    <p className={'mt-1 text-xs text-red-400'}>{errors.passwordConfirmation}</p>
                                )}
                            </div>

                            <button
                                type={'submit'}
                                disabled={isSubmitting}
                                className={'w-full h-10 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'}
                            >
                                {isSubmitting ? 'Resetting...' : 'Reset Password'}
                            </button>
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
