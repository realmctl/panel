import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisH } from '@fortawesome/free-solid-svg-icons';
import Can from '@/components/elements/Can';
import { Dialog } from '@/components/elements/dialog';
import { ServerContext } from '@/state/server';

export type PowerAction = 'start' | 'stop' | 'restart' | 'kill';

interface ServerPowerControlsProps {
    variant: 'header' | 'card';
}

const btnBase =
    'px-4 py-2 text-sm font-medium rounded-md border-0 cursor-pointer transition-colors duration-150';
const btnStart = `${btnBase} text-white bg-green-600 hover:bg-green-700`;
const btnStop = `${btnBase} text-white bg-red-500 hover:bg-red-600`;
const btnKill = `${btnBase} text-neutral-200 bg-neutral-700/60 hover:bg-neutral-700 border border-realm-border`;

export default ({ variant }: ServerPowerControlsProps) => {
    const status = ServerContext.useStoreState((state) => state.status.value);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);
    const [killDialogOpen, setKillDialogOpen] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);
    const moreRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (status === 'offline') {
            setKillDialogOpen(false);
        }
    }, [status]);

    useEffect(() => {
        if (variant !== 'header') {
            return;
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
                setMoreOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [variant]);

    const sendAction = (action: PowerAction) => {
        if (instance) {
            instance.send('set state', action);
        }
        setMoreOpen(false);
    };

    const showStart = status === 'offline' || status === null;
    const showShutdown = status === 'running' || status === 'starting';
    const showKill = status === 'running' || status === 'starting' || status === 'stopping';
    const canRestart = status === 'running';

    const containerClass = variant === 'card' ? 'flex gap-2' : 'flex items-center gap-2';

    return (
        <div className={containerClass}>
            <Dialog.Confirm
                open={killDialogOpen}
                hideCloseIcon
                onClose={() => setKillDialogOpen(false)}
                title={'Forcibly Stop Process'}
                confirm={'Continue'}
                onConfirmed={() => {
                    setKillDialogOpen(false);
                    sendAction('kill');
                }}
            >
                Forcibly stopping a server can lead to data corruption.
            </Dialog.Confirm>

            {showStart && (
                <Can action={'control.start'}>
                    <button type={'button'} onClick={() => sendAction('start')} className={btnStart}>
                        Start
                    </button>
                </Can>
            )}
            {showShutdown && (
                <Can action={'control.stop'}>
                    <button type={'button'} onClick={() => sendAction('stop')} className={btnStop}>
                        Shut down
                    </button>
                </Can>
            )}
            {showKill && (
                <Can action={'control.stop'}>
                    <button type={'button'} onClick={() => setKillDialogOpen(true)} className={btnKill}>
                        Kill Server
                    </button>
                </Can>
            )}
            {variant === 'header' && (
                <Can action={'control.restart'}>
                    <div className={'relative'} ref={moreRef}>
                        <button
                            type={'button'}
                            onClick={() => setMoreOpen(!moreOpen)}
                            className={
                                'flex items-center justify-center w-9 h-9 text-neutral-300 hover:text-neutral-100 bg-neutral-700/50 hover:bg-neutral-700 rounded-md border-0 cursor-pointer transition-colors duration-150'
                            }
                        >
                            <FontAwesomeIcon icon={faEllipsisH} />
                        </button>
                        {moreOpen && (
                            <div
                                className={
                                    'absolute right-0 top-full mt-2 w-44 rounded-lg shadow-lg py-1 z-50 border border-realm-border bg-realm-popover'
                                }
                            >
                                <button
                                    type={'button'}
                                    onClick={() => sendAction('restart')}
                                    disabled={!canRestart}
                                    className={
                                        'flex items-center w-full px-4 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 border-0 bg-transparent cursor-pointer transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed'
                                    }
                                >
                                    Restart
                                </button>
                            </div>
                        )}
                    </div>
                </Can>
            )}
        </div>
    );
};
