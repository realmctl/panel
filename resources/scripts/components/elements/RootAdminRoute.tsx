import React from 'react';
import { useStoreState } from '@/state/hooks';
import { ServerError } from '@/components/elements/ScreenBlock';

export default ({ children }: { children: React.ReactNode }) => {
    const rootAdmin = useStoreState((state) => state.user.data?.rootAdmin);

    if (!rootAdmin) {
        return (
            <div className={'min-h-screen flex items-center justify-center bg-realm-page p-8'}>
                <ServerError
                    title={'Access Denied'}
                    message={'You must be an administrator to access this area.'}
                    onBack={() => window.history.back()}
                />
            </div>
        );
    }

    return <>{children}</>;
};
