import React, { useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import PageContentBlock from '@/components/elements/PageContentBlock';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBan, faExchangeAlt, faServer } from '@fortawesome/free-solid-svg-icons';

const ProgressBar = () => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Simulate progress that slows down as it approaches 90%
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 90) return prev;
                const remaining = 90 - prev;
                const increment = Math.max(0.3, remaining * 0.02);
                return Math.min(90, prev + increment);
            });
        }, 500);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className={'w-full max-w-md flex items-center gap-3'}>
            <div className={'flex-1 h-2 rounded-full overflow-hidden'} style={{ backgroundColor: '#2d3338' }}>
                <div
                    className={'h-full rounded-full transition-all duration-500 ease-out'}
                    style={{ width: `${progress}%`, backgroundColor: '#ffffff' }}
                />
            </div>
            <span className={'text-sm text-neutral-400 font-mono w-10 text-right'}>{Math.round(progress)}%</span>
        </div>
    );
};

export default () => {
    const status = ServerContext.useStoreState((state) => state.server.data?.status || null);
    const isTransferring = ServerContext.useStoreState((state) => state.server.data?.isTransferring || false);
    const isNodeUnderMaintenance = ServerContext.useStoreState(
        (state) => state.server.data?.isNodeUnderMaintenance || false
    );

    let showProgress = true;
    let icon = faServer;
    let title = 'Running Installer';
    let message = 'Your server should be ready soon, please try again in a few minutes.';
    let color = 'text-blue-400';

    if (status === 'suspended') {
        icon = faBan;
        showProgress = false;
        title = 'Server Suspended';
        message = 'This server is suspended and cannot be accessed.';
        color = 'text-red-400';
    } else if (isNodeUnderMaintenance) {
        icon = faServer;
        showProgress = false;
        title = 'Node under Maintenance';
        message = 'The node of this server is currently under maintenance.';
        color = 'text-yellow-400';
    } else if (isTransferring) {
        icon = faExchangeAlt;
        showProgress = true;
        title = 'Transferring';
        message = 'Your server is being transferred to a new node, please check back later.';
        color = 'text-blue-400';
    } else if (status === 'restoring_backup') {
        showProgress = true;
        title = 'Restoring from Backup';
        message = 'Your server is currently being restored from a backup, please check back in a few minutes.';
        color = 'text-blue-400';
    }

    return (
        <PageContentBlock>
            <div className={'flex flex-col items-center justify-center py-20'}>
                {!showProgress && (
                    <div className={`text-5xl ${color} mb-6`}>
                        <FontAwesomeIcon icon={icon} />
                    </div>
                )}
                <h2 className={'text-2xl font-semibold text-neutral-100 mb-2'}>{title}</h2>
                <p className={'text-sm text-neutral-400 text-center max-w-md mb-6'}>{message}</p>
                {showProgress && <ProgressBar />}
            </div>
        </PageContentBlock>
    );
};
