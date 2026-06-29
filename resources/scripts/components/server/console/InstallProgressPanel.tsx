import React from 'react';
import { InstallProgressState } from '@/components/server/console/installProgressParser';
import { CheckIcon } from '@heroicons/react/solid';
import classNames from 'classnames';

interface Props {
    progress: InstallProgressState;
}

export default ({ progress }: Props) => {
    const isComplete = progress.phase === 'complete';

    return (
        <div className={'flex-shrink-0 border-t border-[#232b30] px-4 py-3 flex gap-3'}>
            {progress.steps.map((step) => {
                const isDone = step.status === 'done' || isComplete;
                const isActive = step.status === 'active' && !isComplete;
                const isError = step.status === 'error';

                const barWidth = isDone
                    ? 100
                    : isActive
                    ? step.id === 'downloading' && progress.downloadPercent !== null
                        ? progress.downloadPercent
                        : Math.max(8, progress.overallPercent)
                    : 0;

                return (
                    <div key={step.id} className={'flex-1 min-w-0 space-y-1.5'}>
                        <div className={'flex items-center justify-between gap-1'}>
                            <span
                                className={classNames('text-xs truncate', {
                                    'text-neutral-300': isActive,
                                    'text-neutral-500': isDone && !isActive,
                                    'text-red-400': isError,
                                    'text-neutral-600': !isDone && !isActive && !isError,
                                })}
                            >
                                {step.label}
                            </span>
                            {isDone && (
                                <CheckIcon className={'w-3 h-3 text-emerald-500 flex-shrink-0'} />
                            )}
                            {isActive && step.id === 'downloading' && progress.downloadPercent !== null && (
                                <span className={'text-[10px] font-mono text-neutral-500 flex-shrink-0 tabular-nums'}>
                                    {Math.round(progress.downloadPercent)}%
                                </span>
                            )}
                        </div>
                        <div className={'h-0.5 rounded-full bg-[#2a3038] overflow-hidden'}>
                            <div
                                className={classNames('h-full rounded-full transition-all duration-500 ease-out', {
                                    'bg-emerald-500': isDone,
                                    'bg-blue-500': isActive,
                                    'bg-red-500': isError,
                                })}
                                style={{ width: `${barWidth}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
