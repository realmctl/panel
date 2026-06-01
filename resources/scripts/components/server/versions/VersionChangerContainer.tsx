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
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { ServerContext } from '@/state/server';
import getVersions from '@/api/server/versions/getVersions';
import installVersion, { InstallResponse } from '@/api/server/versions/installVersion';
import Spinner from '@/components/elements/Spinner';

const SERVER_TYPES = [
    { id: 'paper',    name: 'Paper',    description: 'High performance Minecraft server', icon: '/assets/icons/papermc.webp' },
    { id: 'purpur',   name: 'Purpur',   description: 'Paper fork with extra features',    icon: '/assets/icons/purpur.svg' },
    { id: 'vanilla',  name: 'Vanilla',  description: 'Official Mojang server',            icon: '/assets/icons/Grass_Block.png' },
    { id: 'spigot',   name: 'Spigot',   description: 'Modified Minecraft server',         icon: '/assets/icons/spigotmc.svg' },
    { id: 'fabric',   name: 'Fabric',   description: 'Lightweight modding platform',      icon: '/assets/icons/fabricmc.png' },
    { id: 'velocity', name: 'Velocity', description: 'Modern proxy server',               icon: '/assets/icons/velocity.webp' },
    { id: 'snapshot', name: 'Snapshot', description: 'Vanilla development versions',      icon: '/assets/icons/Grass_Block.png' },
];

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
            <div className={'flex-1 h-1.5 rounded-full overflow-hidden'} style={{ backgroundColor: '#2d3338' }}>
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
            {/* Notices */}
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

            {/* Server type tab bar */}
            <div
                className={'flex items-center gap-1 p-1 rounded-lg mb-6 flex-wrap'}
                style={{ backgroundColor: '#0e1417', border: '1px solid #2d3338' }}
            >
                {SERVER_TYPES.map((type) => {
                    const active = selectedType === type.id;
                    return (
                        <button
                            key={type.id}
                            onClick={() => setSelectedType(type.id)}
                            className={'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150'}
                            style={
                                active
                                    ? { backgroundColor: '#192024', color: '#e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }
                                    : { color: '#64748b' }
                            }
                        >
                            <img src={type.icon} alt={type.name} className={'w-4 h-4 object-contain flex-shrink-0'} />
                            {type.name}
                        </button>
                    );
                })}
            </div>

            {/* Version list card */}
            <div className={'rounded-lg overflow-hidden'} style={{ backgroundColor: '#192024', border: '1px solid #2d3338' }}>
                {/* Card header */}
                <div
                    className={'flex items-center gap-3 px-5 py-3'}
                    style={{ backgroundColor: '#0e1417', borderBottom: '1px solid #2d3338' }}
                >
                    <img src={activeType.icon} alt={activeType.name} className={'w-4 h-4 object-contain'} />
                    <span className={'text-xs uppercase tracking-wide text-neutral-400'}>{activeType.name}</span>
                    <span className={'text-neutral-600 text-xs'}>—</span>
                    <span className={'text-xs text-neutral-500'}>{activeType.description}</span>
                    {versions.length > 0 && !loading && (
                        <span
                            className={'ml-auto text-xs px-2 py-0.5 rounded-full font-mono'}
                            style={{ backgroundColor: '#1e2d38', color: '#64748b' }}
                        >
                            {versions.length} versions
                        </span>
                    )}
                </div>

                {/* Content */}
                <div className={'p-5'}>
                    {loading ? (
                        <div className={'py-12'}>
                            <Spinner centered size={'large'} />
                        </div>
                    ) : versions.length === 0 ? (
                        <p className={'text-sm text-neutral-500 text-center py-12'}>No versions available.</p>
                    ) : (
                        <div className={'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2'}>
                            {versions.map((version) => (
                                <div
                                    key={version}
                                    className={'flex items-center justify-between px-3 py-2.5 rounded-md transition-colors duration-100'}
                                    style={{ backgroundColor: '#0e1417', border: '1px solid #2d3338' }}
                                >
                                    {installing === version ? (
                                        <DownloadProgress />
                                    ) : (
                                        <>
                                            <span className={'text-sm text-neutral-300 font-mono'}>{version}</span>
                                            <button
                                                onClick={() => handleInstall(version)}
                                                disabled={installing !== null}
                                                className={'ml-3 flex-shrink-0 px-2.5 py-1 text-xs font-medium rounded transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed'}
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
                </div>
            </div>
        </ServerContentBlock>
    );
};
