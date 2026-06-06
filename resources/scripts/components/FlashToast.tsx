import React, { useEffect, useRef, useState } from 'react';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import useFlash from '@/plugins/useFlash';
import { FlashMessage } from '@/state/flashes';

const DISMISS_MS = 5000;
const FADE_MS = 300;

const TYPE_BG: Record<FlashMessage['type'], string> = {
    error: 'bg-red-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
};

const FlashToast = () => {
    const flashes = useStoreState((state: ApplicationStore) => state.flashes.items);
    const { clearFlashes, removeFlash } = useFlash();
    const [activeFlash, setActiveFlash] = useState<FlashMessage | null>(null);
    const [visible, setVisible] = useState(false);
    const dismissTimer = useRef<ReturnType<typeof setTimeout>>();
    const hideTimer = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        if (!flashes.length) {
            setVisible(false);
            const timer = setTimeout(() => setActiveFlash(null), FADE_MS);
            return () => clearTimeout(timer);
        }

        const latest = flashes[flashes.length - 1];
        setActiveFlash(latest);

        clearTimeout(dismissTimer.current);
        clearTimeout(hideTimer.current);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => setVisible(true));
        });

        dismissTimer.current = setTimeout(() => {
            setVisible(false);
            hideTimer.current = setTimeout(() => {
                if (latest.id) {
                    removeFlash(latest.id);
                } else if (latest.key) {
                    clearFlashes(latest.key);
                } else {
                    clearFlashes();
                }
            }, FADE_MS);
        }, DISMISS_MS);

        return () => {
            clearTimeout(dismissTimer.current);
            clearTimeout(hideTimer.current);
        };
    }, [flashes, clearFlashes, removeFlash]);

    if (!activeFlash) {
        return null;
    }

    const message =
        activeFlash.title && activeFlash.title !== 'Error'
            ? `${activeFlash.title}: ${activeFlash.message}`
            : activeFlash.message;

    return (
        <div
            className={'fixed bottom-6 left-1/2 z-[200]'}
            style={{
                opacity: visible ? 1 : 0,
                transform: `translateX(-50%) translateY(${visible ? '0px' : '12px'})`,
                transition: 'opacity 0.3s ease, transform 0.3s ease',
                pointerEvents: visible ? 'auto' : 'none',
            }}
        >
            <div
                className={`${TYPE_BG[activeFlash.type] ?? TYPE_BG.info} px-5 py-3 rounded-lg shadow-lg`}
                style={{ width: '360px' }}
            >
                <p className={'text-sm text-white font-medium text-left break-words whitespace-normal'}>{message}</p>
            </div>
        </div>
    );
};

export default FlashToast;
