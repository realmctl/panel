// TODO(developers): Frontend also needs review:
//
// 1. FAKE PROGRESS — DownloadProgress shows a fake animated bar with no relation to actual download progress.
//    Wings doesn't push progress events to the panel, so either implement a real polling mechanism
//    (check if server.jar exists/changed on disk) or replace the bar with a simple spinner + "downloading…" text.
//
// 2. NO INSTALL LOCK — A user can navigate away and come back while a download is still in progress.
//    Installing state is lost on unmount, so a second install can be triggered mid-download.
//    Consider persisting install state server-side or disabling the page while Wings is working.
//
// 3. SUCCESS TOO EARLY — install() resolves as soon as the API responds, not when the file is on disk.
//    The success message is therefore misleading — the server will fail to start if restarted immediately.
//    Show a warning like "Download in progress, wait before restarting."
//
// 4. TS ERRORS (pre-existing) — .finally() is used on Promise but tsconfig lib does not include es2018+.
//    Fix: add "ES2018" (or later) to the lib array in tsconfig.json, or refactor to use .then()/.catch() without .finally().
//    Affected lines: getVersions chain (~line 76) and installVersion chain (~line 96).

import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { ServerContext } from '@/state/server';
import getVersions from '@/api/server/versions/getVersions';
import installVersion, { InstallResponse } from '@/api/server/versions/installVersion';
import Spinner from '@/components/elements/Spinner';
import RealmCard from '@/components/elements/realm/RealmCard';
import RealmCardSourceHeader from '@/components/elements/realm/RealmCardSourceHeader';
import { realmClasses } from '@/lib/realmTokens';
import { SERVER_SOFTWARE as SERVER_TYPES } from '@/lib/serverSoftware';

const DownloadProgress = () => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 95) return prev;
                const remaining = 95 - prev;
                return Math.min(95, prev + Math.max(0.5, remaining * 0.04));
            });
        }, 300);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={'flex items-center gap-3 w-full'}>
            <div className={'flex-1 h-1.5 rounded-full overflow-hidden bg-realm-surface'}>
                <div
                    className={'h-full rounded-full transition-all duration-300 ease-out bg-blue-500'}
                    style={{ width: `${progress}%` }}
                />
            </div>
            <span className={'text-xs text-neutral-400 font-mono w-8 text-right'}>{Math.round(progress)}%</span>
        </div>
    );
};

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [selectedType, setSelectedType] = useState('paper');
    const [versions, setVersions]         = useState<string[]>([]);
    const [loading, setLoading]           = useState(false);
    const [installing, setInstalling]     = useState<string | null>(null);
    const [result, setResult]             = useState<InstallResponse | null>(null);
    const [error, setError]               = useState<string | null>(null);

    const activeType = SERVER_TYPES.find((t) => t.id === selectedType)!;

    useEffect(() => {
        setLoading(true);
        setError(null);
        setVersions([]);
        getVersions(uuid, selectedType)
            .then((data) => setVersions(data.versions))
            .catch(() => setError('Failed to load versions.'))
            .finally(() => setLoading(false));
    }, [selectedType, uuid]);

    const handleInstall = (version: string) => {
        setInstalling(version);
        setResult(null);
        setError(null);
        installVersion(uuid, selectedType, version)
            .then((data) => {
                if (data.success) {
                    setResult(data);
                } else {
                    setError(data.error || 'Installation failed.');
                }
            })
            .catch((err) => {
                setError(
                    err?.response?.data?.error ||
                    err?.response?.data?.errors?.[0]?.detail ||
                    'Installation failed. Check server logs for details.'
                );
            })
            .finally(() => setInstalling(null));
    };

    return (
        <ServerContentBlock title={'Version Changer'}>
            {result && (
                <div className={'mb-4 p-4 rounded-lg text-sm'} style={{ backgroundColor: '#0d2f2a', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399' }}>
                    Successfully installed <strong>{result.version}</strong>. Restart your server to apply changes.
                </div>
            )}
            {error && (
                <div className={'mb-4 p-4 rounded-lg text-sm'} style={{ backgroundColor: '#1c0a0a', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                    {error}
                </div>
            )}

            <div className={classNames('flex items-center gap-1 p-1 rounded-lg mb-6 flex-wrap', realmClasses.tabBar)}>
                {SERVER_TYPES.map((type) => {
                    const active = selectedType === type.id;
                    return (
                        <button
                            key={type.id}
                            onClick={() => setSelectedType(type.id)}
                            className={classNames(
                                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 border-0 cursor-pointer',
                                active ? realmClasses.tabActive : realmClasses.tabInactive
                            )}
                        >
                            <img src={type.icon} alt={type.name} className={'w-4 h-4 object-contain flex-shrink-0'} />
                            {type.name}
                        </button>
                    );
                })}
            </div>

            <RealmCard
                bodyClassName={'p-5'}
                headerClassName={'px-5 py-3'}
                header={
                    <RealmCardSourceHeader
                        label={activeType.name}
                        description={activeType.description}
                        icon={activeType.icon}
                        badge={versions.length > 0 && !loading ? `${versions.length} versions` : undefined}
                    />
                }
            >
                {loading ? (
                    <div className={'py-12'}>
                        <Spinner centered size={'large'} />
                    </div>
                ) : versions.length === 0 ? (
                    <p className={'text-sm text-neutral-500 text-center py-12 m-0'}>No versions available.</p>
                ) : (
                    <div className={'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2'}>
                        {versions.map((version) => (
                            <div
                                key={version}
                                className={classNames(
                                    'flex items-center justify-between px-3 py-2.5 rounded-md transition-colors duration-100',
                                    realmClasses.row
                                )}
                            >
                                {installing === version ? (
                                    <DownloadProgress />
                                ) : (
                                    <>
                                        <span className={'text-sm text-neutral-300 font-mono'}>{version}</span>
                                        <button
                                            onClick={() => handleInstall(version)}
                                            disabled={installing !== null}
                                            className={
                                                'ml-3 flex-shrink-0 px-2.5 py-1 text-xs font-medium rounded transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed'
                                            }
                                            style={{ backgroundColor: '#1e3a5f', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}
                                        >
                                            Install
                                        </button>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </RealmCard>
        </ServerContentBlock>
    );
};
