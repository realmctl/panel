import React, { useEffect, useState } from 'react';
import { InstallProgressState } from '@/components/server/console/installProgressParser';
import { CheckCircleIcon, ExclamationCircleIcon, TerminalIcon } from '@heroicons/react/solid';
import classNames from 'classnames';

interface Props {
    progress: InstallProgressState;
    recentLines: string[];
    onToggleRawLogs: () => void;
}

const formatElapsed = (startedAt: number): string => {
    const seconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const StepIcon = ({ status }: { status: 'pending' | 'active' | 'done' | 'error' }) => {
    if (status === 'done') return <CheckCircleIcon className={'w-4 h-4 text-emerald-400 flex-shrink-0'} />;
    if (status === 'error') return <ExclamationCircleIcon className={'w-4 h-4 text-red-400 flex-shrink-0'} />;
    if (status === 'active') {
        return (
            <span className={'w-4 h-4 flex-shrink-0 flex items-center justify-center'}>
                <span className={'w-2 h-2 rounded-full bg-blue-400 animate-pulse'} />
            </span>
        );
    }
    return (
        <span className={'w-4 h-4 flex-shrink-0 flex items-center justify-center'}>
            <span className={'w-2 h-2 rounded-full border border-[#3d4450]'} />
        </span>
    );
};

export default ({ progress, recentLines, onToggleRawLogs }: Props) => {
    const [elapsed, setElapsed] = useState(formatElapsed(progress.startedAt));
    const isComplete = progress.phase === 'complete';
    const isFailed = progress.phase === 'failed';
    const isDownloading = progress.phase === 'downloading';

    useEffect(() => {
        if (isComplete || isFailed) {
            setElapsed(formatElapsed(progress.startedAt));
            return;
        }
        const id = setInterval(() => setElapsed(formatElapsed(progress.startedAt)), 1000);
        return () => clearInterval(id);
    }, [progress.startedAt, isComplete, isFailed]);

    return (
        <div className={'h-full flex flex-col bg-[#192024] overflow-hidden'}>
            {/* ── Header ─────────────────────────────────────────────── */}
            <div className={'flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#232b30]'}>
                <div className={'flex items-center gap-3'}>
                    {isComplete ? (
                        <CheckCircleIcon className={'w-5 h-5 text-emerald-400'} />
                    ) : isFailed ? (
                        <ExclamationCircleIcon className={'w-5 h-5 text-red-400'} />
                    ) : (
                        <span className={'relative flex h-3 w-3'}>
                            <span className={'animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-40'} />
                            <span className={'relative inline-flex rounded-full h-3 w-3 bg-blue-500'} />
                        </span>
                    )}
                    <div>
                        <p className={'text-sm font-semibold text-white leading-none'}>
                            {isComplete ? 'Installation complete' : isFailed ? 'Installation failed' : 'Installing server'}
                        </p>
                        {progress.detail && !isComplete && !isFailed && (
                            <p className={'text-xs text-neutral-500 mt-1 font-mono truncate max-w-xs'}>
                                {progress.detail}
                            </p>
                        )}
                    </div>
                </div>
                <span className={'text-xs font-mono text-neutral-500 tabular-nums'}>{elapsed}</span>
            </div>

            {/* ── Overall progress bar ───────────────────────────────── */}
            <div className={'px-6 pt-4 pb-3'}>
                <div className={'flex items-center justify-between mb-2'}>
                    <span className={'text-[10px] uppercase tracking-widest text-neutral-600 font-medium'}>
                        Overall progress
                    </span>
                    <span className={'text-[10px] font-mono text-neutral-500 tabular-nums'}>
                        {Math.round(progress.overallPercent)}%
                    </span>
                </div>
                <div className={'h-1.5 w-full rounded-full bg-[#232b30] overflow-hidden'}>
                    <div
                        className={classNames(
                            'h-full rounded-full transition-all duration-700 ease-out',
                            isComplete ? 'bg-emerald-500' : isFailed ? 'bg-red-500' : 'bg-blue-500'
                        )}
                        style={{ width: `${Math.max(3, progress.overallPercent)}%` }}
                    />
                </div>
            </div>

            {/* ── Main area: steps + detail ──────────────────────────── */}
            <div className={'flex flex-1 min-h-0 overflow-hidden px-6 pb-4 gap-6 pt-2'}>
                {/* Steps column */}
                <div className={'flex flex-col justify-center w-44 flex-shrink-0'}>
                    {progress.steps.map((step, i) => (
                        <div key={step.id}>
                            <div className={'flex items-center gap-2.5 py-2'}>
                                <StepIcon status={step.status} />
                                <span
                                    className={classNames('text-xs font-medium flex-1 min-w-0', {
                                        'text-emerald-400': step.status === 'done',
                                        'text-white': step.status === 'active',
                                        'text-red-400': step.status === 'error',
                                        'text-neutral-600': step.status === 'pending',
                                    })}
                                >
                                    {step.label}
                                </span>
                                {step.status === 'done' && (
                                    <span className={'text-[10px] font-mono text-emerald-600'}>done</span>
                                )}
                                {step.status === 'active' &&
                                    step.id === 'downloading' &&
                                    progress.downloadPercent !== null && (
                                        <span className={'text-[10px] font-mono text-blue-400 tabular-nums'}>
                                            {Math.round(progress.downloadPercent)}%
                                        </span>
                                    )}
                            </div>
                            {i < progress.steps.length - 1 && (
                                <div
                                    className={classNames('ml-[7px] w-px h-3', {
                                        'bg-emerald-500/30': step.status === 'done',
                                        'bg-blue-500/20': step.status === 'active',
                                        'bg-[#232b30]': step.status === 'pending' || step.status === 'error',
                                    })}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Divider */}
                <div className={'w-px bg-[#232b30] flex-shrink-0'} />

                {/* Detail column */}
                <div className={'flex-1 min-w-0 flex flex-col gap-4 justify-center'}>
                    {/* Download stats */}
                    {isDownloading && (progress.downloadPercent !== null || progress.downloadSpeed) && (
                        <div className={'space-y-2.5'}>
                            {progress.downloadPercent !== null && (
                                <>
                                    <div className={'h-1 w-full rounded-full bg-[#232b30] overflow-hidden'}>
                                        <div
                                            className={'h-full rounded-full bg-blue-500/60 transition-all duration-500'}
                                            style={{ width: `${progress.downloadPercent}%` }}
                                        />
                                    </div>
                                    <div className={'flex justify-between text-[10px] font-mono text-neutral-600'}>
                                        <span>{progress.downloadReceived ?? '—'}</span>
                                        <span>{progress.downloadTotal ?? '—'}</span>
                                    </div>
                                </>
                            )}
                            {progress.downloadSpeed && (
                                <div className={'flex items-center gap-1.5'}>
                                    <span className={'text-[10px] uppercase tracking-widest text-neutral-600'}>Speed</span>
                                    <span className={'text-xs font-mono text-neutral-300'}>{progress.downloadSpeed}/s</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Error */}
                    {isFailed && progress.error && (
                        <div className={'border border-red-500/20 bg-red-500/8 rounded-lg px-4 py-3'}>
                            <p className={'text-xs font-mono text-red-400 break-all leading-relaxed'}>
                                {progress.error}
                            </p>
                        </div>
                    )}

                    {/* Activity feed */}
                    {recentLines.length > 0 && !isFailed && (
                        <div>
                            <p className={'text-[10px] uppercase tracking-widest text-neutral-600 font-medium mb-2'}>
                                Activity
                            </p>
                            <div className={'space-y-1.5'}>
                                {recentLines.map((line, i) => (
                                    <div key={i} className={'flex items-start gap-2'}>
                                        <span className={'text-neutral-700 text-[10px] mt-px select-none'}>›</span>
                                        <p
                                            className={classNames(
                                                'text-xs font-mono truncate leading-relaxed',
                                                i === recentLines.length - 1
                                                    ? 'text-neutral-300'
                                                    : 'text-neutral-600'
                                            )}
                                            title={line}
                                        >
                                            {line}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Footer ─────────────────────────────────────────────── */}
            <div className={'flex items-center justify-end px-6 pb-4 pt-1 border-t border-[#232b30]'}>
                <button
                    type={'button'}
                    onClick={onToggleRawLogs}
                    className={
                        'flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-300 transition-colors duration-150'
                    }
                >
                    <TerminalIcon className={'w-3.5 h-3.5'} />
                    View install logs
                </button>
            </div>
        </div>
    );
};
