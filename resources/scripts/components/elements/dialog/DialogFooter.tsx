import React, { useContext } from 'react';
import { DialogContext } from './';
import { useDeepCompareEffect } from '@/plugins/useDeepCompareEffect';

export default ({ children }: { children: React.ReactNode }) => {
    const { setFooter, appearance } = useContext(DialogContext);

    useDeepCompareEffect(() => {
        setFooter(
            appearance === 'admin' ? (
                <div className={'dark flex items-center justify-end gap-2 rounded-b-lg border-t border-border bg-card px-5 py-4'}>
                    {children}
                </div>
            ) : (
                <div className={'flex items-center justify-end space-x-3 rounded-b bg-gray-700 px-6 py-3'}>{children}</div>
            )
        );
    }, [children, appearance]);

    return null;
};
