import React, { useEffect, useState } from 'react';
import { InstallProgressState } from '@/components/server/console/installProgressParser';
import { CheckCircleIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/solid';
import classNames from 'classnames';

interface Props {
    progress: InstallProgressState;
    showRawLogs: boolean;
    onToggleRawLogs: () => void;
}

const formatElapsed = (startedAt: number): string => {
    const seconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;

    if (minutes > 0) {
        return `${minutes}m ${remainder}s`;
    }

    return `${remainder}s`;
};

const StepBar = ({ progress, active }: { progress: number; active: boolean }) => (
    <div className={'h-1.5 flex-1 rounded-full overflow-hidden bg-[#2d3338]'}>
        <div
            className={classNames(
                'h-full rounded-full transition-all duration-500 ease-out',
                active ? 'bg-blue-500' : 'bg-emerald-500/80'
            )}
            style={{ width: `${Math.min(100, Math.max(active ? 8 : 100, progress))}%` }}
        />
    </div>
);

export default ({ progress, showRawLogs, onToggleRawLogs }: Props) => {
    const [elapsed, setElapsed] = useState(formatElapsed(progress.startedAt));
    const isComplete = progress.phase === 'complete';
    const isFailed = progress.phase === 'failed';

    useEffect(() => {
        if (isComplete || isFailed) {
            setElapsed(formatElapsed(progress.startedAt));
            return;
        }

        const interval = setInterval(() => {
            setElapsed(formatElapsed(progress.startedAt));
        }, 1000);

        return () => clearInterval(interval);
    }, [progress.startedAt, isComplete, isFailed]);

    return (
        <div className={'border-t border-[#2d3338] bg-[#14181c] px-4 py-3 space-y-3'}>
            <div className={'flex items-start justify-between gap-3'}>
                <div className={'min-w-0 flex-1'}>
                    <div className={'flex items-center gap-2'}>
                        {isComplete ? (
                            <CheckCircleIcon className={'w-4 h-4 text-emerald-400 flex-shrink-0'} />
                        ) : (
                            <span
                                className={classNames(
                                    'w-2 h-2 rounded-full flex-shrink-0',
                                    isFailed ? 'bg-red-500' : 'bg-blue-400 animate-pulse'
                                )}
                            />
                        )}
                        <p className={'text-sm font-medium text-neutral-100 truncate'}>{progress.label}</p>
                        <span className={'text-xs text-neutral-500 font-mono flex-shrink-0'}>{elapsed}</span>
                    </div>
                    {progress.detail && (
                        <p className={'text-xs text-neutral-400 mt-1 truncate font-mono'} title={progress.detail}>
                            {progress.detail}
                        </p>
                    )}
                </div>
                <button
                    type={'button'}
                    onClick={onToggleRawLogs}
                    className={
                        'flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-200 transition-colors flex-shrink-0'
                    }
                >
                    {showRawLogs ? (
                        <>
                            Hide logs
                            <ChevronDownIcon className={'w-3.5 h-3.5'} />
                        </>
                    ) : (
                        <>
                            Show logs
                            <ChevronUpIcon className={'w-3.5 h-3.5'} />
                        </>
                    )}
                </button>
            </div>

            <div className={'space-y-2'}>
                <div className={'flex items-center gap-3'}>
                    <span className={'text-xs text-neutral-500 w-24 flex-shrink-0'}>Overall</span>
                    <StepBar progress={progress.overallPercent} active={!isComplete && !isFailed} />
                    <span className={'text-xs text-neutral-400 font-mono w-10 text-right'}>
                        {Math.round(progress.overallPercent)}%
                    </span>
                </div>

                {progress.steps.map((step) => (
                    <div key={step.id} className={'flex items-center gap-3'}>
                        <span
                            className={classNames(
                                'text-xs w-24 flex-shrink-0 truncate',
                                step.status === 'active'
                                    ? 'text-blue-300'
                                    : step.status === 'done'
                                    ? 'text-emerald-400/80'
                                    : step.status === 'error'
                                    ? 'text-red-400'
                                    : 'text-neutral-600'
                            )}
                        >
                            {step.label.split(' ')[0]}
                        </span>
                        <StepBar
                            progress={
                                step.status === 'done'
                                    ? 100
                                    : step.status === 'active'
                                    ? step.id === 'downloading' && progress.downloadPercent !== null
                                        ? progress.downloadPercent
                                        : progress.overallPercent
                                    : 0
                            }
                            active={step.status === 'active'}
                        />
                        <span className={'text-xs w-10 text-right flex-shrink-0'}>
                            {step.status === 'done' && '✓'}
                            {step.status === 'active' &&
                                (step.id === 'downloading' && progress.downloadPercent !== null
                                    ? `${Math.round(progress.downloadPercent)}%`
                                    : '…')}
                            {step.status === 'error' && '!'}
                        </span>
                    </div>
                ))}
            </div>

            {isFailed && progress.error && (
                <p className={'text-xs text-red-400 border border-red-500/20 bg-red-500/10 rounded px-2 py-1.5'}>
                    {progress.error}
                </p>
            )}
        </div>
    );
};
