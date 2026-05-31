import React from 'react';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';

const AuthFooter = () => {
    const name = useStoreState((state: ApplicationStore) => state.settings.data!.name);

    return (
        <>
            <div className={'fixed bottom-4 left-4'}>
                <p className={'text-xs text-gray-600'}>
                    &copy; {new Date().getFullYear()} Realm Software
                </p>
            </div>
            <div className={'fixed bottom-4 right-4'}>
                <p className={'text-xs text-gray-600'}>
                    {name} &middot; {(process.env.WEBPACK_BUILD_HASH || 'dev').slice(0, 7)}
                </p>
            </div>
        </>
    );
};

export default AuthFooter;
