import React, { useEffect, useState } from 'react';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import useFlash from '@/plugins/useFlash';

const AuthToast = () => {
    const flashes = useStoreState((state: ApplicationStore) => state.flashes.items);
    const { clearFlashes } = useFlash();
    const [visible, setVisible] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (flashes.length > 0) {
            setMounted(true);
            // Small delay to trigger CSS transition after mount
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setVisible(true);
                });
            });
            const timer = setTimeout(() => {
                setVisible(false);
                setTimeout(() => {
                    setMounted(false);
                    clearFlashes();
                }, 300);
            }, 5000);
            return () => clearTimeout(timer);
        }
        setVisible(false);
        setMounted(false);
        return undefined;
    }, [flashes]);

    if (!mounted || !flashes.length) return null;

    const flash = flashes[flashes.length - 1];

    const bgColor = flash.type === 'error'
        ? 'bg-red-500'
        : flash.type === 'success'
            ? 'bg-green-500'
            : flash.type === 'warning'
                ? 'bg-yellow-500'
                : 'bg-blue-500';

    return (
        <div
            className={'fixed bottom-6 left-1/2 z-50'}
            style={{
                opacity: visible ? 1 : 0,
                transform: `translateX(-50%) translateY(${visible ? '0px' : '12px'})`,
                transition: 'opacity 0.3s ease, transform 0.3s ease',
                pointerEvents: visible ? 'auto' : 'none',
            }}
        >
            <div className={`${bgColor} px-5 py-3 rounded-lg shadow-lg`} style={{ width: '360px' }}>
                <p className={'text-sm text-white font-medium text-left break-words whitespace-normal'}>{flash.message}</p>
            </div>
        </div>
    );
};

export default AuthToast;
