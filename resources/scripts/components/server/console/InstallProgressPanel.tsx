import React, { useEffect, useState } from 'react';
import { InstallProgressState } from '@/components/server/console/installProgressParser';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/solid';
import classNames from 'classnames';

interface Props {
    progress: InstallProgressState;
    onToggleRawLogs: () => void;
}

const formatElapsed = (startedAt: number): string => {
    const seconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainder}s` : `${remainder}s`;
};

export default ({ progress, onToggleRawLogs }: Props) => {
    const [elapsed, setElapsed] = useState(formatElapsed(progress.startedAt));
    const isComplete = progress.phase === 'complete';
    const isFailed = progress.phase === 'failed';

    useEffect(() => {
        if (isComplete || isFailed) {
            setElapsed(formatElapsed(progress.startedAt));
            return;
        }
        const interval = setInterval(() => setElapsed(formatElapsed(progress.startedAt)), 1000);
        return () => clearInterval(interval);
    }, [progress.startedAt, isComplete, isFailed]);

    return (
        <div className={'h-full flex flex-col items-center justify-center bg-[#192024] px-6'}>
            <div className={'w-full max-w-sm space-y-5'}>
                {/* Header */}
                <div className={'space-y-1'}>
                    <div className={'flex items-center gap-2.5'}>
                        {isComplete ? (
                            <CheckCircleIcon className={'w-4 h-4 text-emerald-400 flex-shrink-0'} />
                        ) : isFailed ? (
                            <ExclamationCircleIcon className={'w-4 h-4 text-red-400 flex-shrink-0'} />
                        ) : (
                            <span className={'w-2 h-2 rounded-full bg-blue-400 animate-pulse flex-shrink-0'} />
                        )}
                        <span className={'text-sm font-semibold text-neutral-100 flex-1'}>{progress.label}</span>
                        <span className={'text-xs text-neutral-500 font-mono'}>{elapsed}</span>
                    </div>
                    {progress.detail && (
                        <p
                            className={'text-xs text-neutral-500 font-mono truncate pl-[18px]'}
                            title={progress.detail}
                        >
                            {progress.detail}
                        </p>
                    )}
                </div>

                {/* Overall bar */}
                <div className={'space-y-1.5'}>
                    <div className={'h-1.5 rounded-full bg-[#2d3338] overflow-hidden'}>
                        <div
                            className={classNames(
                                'h-full rounded-full transition-all duration-700 ease-out',
                                isComplete ? 'bg-emerald-500' : isFailed ? 'bg-red-500' : 'bg-blue-500'
                            )}
                            style={{ width: `${Math.max(4, progress.overallPercent)}%` }}
                        />
                    </div>
                    <div className={'flex justify-between'}>
                        <span className={'text-[10px] text-neutral-600'}>Overall progress</span>
                        <span className={'text-[10px] text-neutral-500 font-mono'}>
                            {Math.round(progress.overallPercent)}%
                        </span>
                    </div>
                </div>

                {/* Steps */}
                <div className={'space-y-2.5'}>
                    {progress.steps.map((step) => {
                        const isDone = step.status === 'done';
                        const isActive = step.status === 'active';
                        const isError = step.status === 'error';

                        const barWidth = isDone
                            ? 100
                            : isActive
                            ? step.id === 'downloading' && progress.downloadPercent !== null
                                ? progress.downloadPercent
                                : 50
                            : 0;

                        return (
                            <div key={step.id} className={'flex items-center gap-3'}>
                                <div
                                    className={classNames('w-1.5 h-1.5 rounded-full flex-shrink-0', {
                                        'bg-emerald-400': isDone,
                                        'bg-blue-400 animate-pulse': isActive,
                                        'bg-red-400': isError,
                                        'bg-[#2d3338]': !isDone && !isActive && !isError,
                                    })}
                                />
                                <span
                                    className={classNames('text-xs w-28 flex-shrink-0', {
                                        'text-emerald-400/70': isDone,
                                        'text-neutral-200': isActive,
                                        'text-red-400': isError,
                                        'text-neutral-600': !isDone && !isActive && !isError,
                                    })}
                                >
                                    {step.label}
                                </span>
                                <div className={'h-px flex-1 rounded-full overflow-hidden bg-[#2d3338]'}>
                                    <div
                                        className={classNames('h-full rounded-full transition-all duration-500', {
                                            'bg-emerald-500/60': isDone,
                                            'bg-blue-500': isActive,
                                            'bg-red-500': isError,
                                        })}
                                        style={{ width: `${barWidth}%` }}
                                    />
                                </div>
                                <span className={'text-xs font-mono w-8 text-right flex-shrink-0 text-neutral-600'}>
                                    {isDone
                                        ? '✓'
                                        : isActive && step.id === 'downloading' && progress.downloadPercent !== null
                                        ? `${Math.round(progress.downloadPercent)}%`
                                        : ''}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {isFailed && progress.error && (
                    <p className={'text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2'}>
                        {progress.error}
                    </p>
                )}

                <div className={'flex justify-end'}>
                    <button
                        type={'button'}
                        onClick={onToggleRawLogs}
                        className={'text-xs text-neutral-600 hover:text-neutral-400 transition-colors'}
                    >
                        Show raw logs
                    </button>
                </div>
            </div>
        </div>
    );
};
