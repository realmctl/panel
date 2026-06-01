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
    { id: 'paper', name: 'Paper', description: 'High performance Minecraft server', icon: '/assets/icons/papermc.webp' },
    { id: 'purpur', name: 'Purpur', description: 'Paper fork with extra features', icon: '/assets/icons/purpur.svg' },
    { id: 'vanilla', name: 'Vanilla', description: 'Official Mojang server', icon: '/assets/icons/Grass_Block.png' },
    { id: 'spigot', name: 'Spigot', description: 'Modified Minecraft server', icon: '/assets/icons/spigotmc.svg' },
    { id: 'fabric', name: 'Fabric', description: 'Lightweight modding platform', icon: '/assets/icons/fabricmc.png' },
    { id: 'velocity', name: 'Velocity', description: 'Modern proxy server', icon: '/assets/icons/velocity.webp' },
    { id: 'snapshot', name: 'Snapshot', description: 'Vanilla development versions', icon: '/assets/icons/Grass_Block.png' },
];

const DownloadProgress = () => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 95) return prev;
                const remaining = 95 - prev;
                const increment = Math.max(0.5, remaining * 0.04);
                return Math.min(95, prev + increment);
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
    const [versions, setVersions] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [installing, setInstalling] = useState<string | null>(null);
    const [result, setResult] = useState<InstallResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        setVersions([]);
        getVersions(uuid, selectedType)
            .then((data) => setVersions(data.versions))
            .catch((err) => setError('Failed to load versions'))
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
                    setError(data.error || 'Installation failed');
                }
            })
            .catch((err) => {
                const message = err?.response?.data?.error || err?.response?.data?.errors?.[0]?.detail || 'Installation failed. Check server logs for details.';
                setError(message);
            })
            .finally(() => setInstalling(null));
    };

    return (
        <ServerContentBlock title={'Version Changer'}>
            {/* Success message */}
            {result && (
                <div className={'mb-4 p-4 rounded-md border border-green-500/30 bg-green-500/10 text-green-300 text-sm'}>
                    Successfully installed <strong>{result.version}</strong>. Restart your server to apply changes.
                </div>
            )}

            {/* Error message */}
            {error && (
                <div className={'mb-4 p-4 rounded-md border border-red-500/30 bg-red-500/10 text-red-300 text-sm'}>
                    {error}
                </div>
            )}

            <div className={'grid grid-cols-1 lg:grid-cols-4 gap-4'}>
                {/* Left: Server type selector */}
                <div className={'lg:col-span-1'}>
                    <div
                        className={'rounded-md border border-[#2d3338]/50 p-4'}
                        style={{ backgroundColor: '#192024' }}
                    >
                        <h2 className={'text-lg font-semibold text-neutral-100 m-0 mb-3'}>Server Type</h2>
                        <div className={'border-t border-[#2d3338]/50 mb-3'}></div>
                        <div className={'space-y-1'}>
                            {SERVER_TYPES.map((type) => {
                                const active = selectedType === type.id;
                                return (
                                    <button
                                        key={type.id}
                                        onClick={() => setSelectedType(type.id)}
                                        className={`w-full text-left px-3 py-2.5 rounded-md text-sm border cursor-pointer transition-all duration-150 flex items-center gap-3 ${
                                            active
                                                ? 'border-blue-500/50 bg-blue-500/10 text-blue-200'
                                                : 'border-transparent bg-transparent text-neutral-300 hover:bg-white/5 hover:text-neutral-100'
                                        }`}
                                    >
                                        <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden transition-all duration-150 ${active ? 'ring-1 ring-blue-400/40' : ''}`} style={{ backgroundColor: '#0f1518' }}>
                                            <img
                                                src={type.icon}
                                                alt={type.name}
                                                className={'w-5 h-5 object-contain'}
                                            />
                                        </div>
                                        <div className={'min-w-0'}>
                                            <div className={'font-medium leading-tight'}>{type.name}</div>
                                            <div className={'text-xs text-neutral-500 mt-0.5 truncate'}>{type.description}</div>
                                        </div>
                                        {active && (
                                            <div className={'ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0'} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right: Version list */}
                <div className={'lg:col-span-3'}>
                    <div
                        className={'rounded-md border border-[#2d3338]/50 p-5'}
                        style={{ backgroundColor: '#192024' }}
                    >
                        <h2 className={'text-lg font-semibold text-neutral-100 m-0 mb-3'}>
                            {SERVER_TYPES.find((t) => t.id === selectedType)?.name} Versions
                        </h2>
                        <div className={'border-t border-[#2d3338]/50 mb-4'}></div>

                        {loading ? (
                            <div className={'py-10'}>
                                <Spinner centered size={'large'} />
                            </div>
                        ) : versions.length === 0 ? (
                            <p className={'text-sm text-neutral-400 text-center py-10'}>No versions available.</p>
                        ) : (
                            <div className={'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2'}>
                                {versions.map((version) => (
                                    <div
                                        key={version}
                                        className={'flex items-center justify-between px-4 py-3 rounded-md border border-[#2d3338]/50 bg-[#0f1518]/50'}
                                    >
                                        {installing === version ? (
                                            <DownloadProgress />
                                        ) : (
                                            <>
                                                <span className={'text-sm text-neutral-200 font-mono'}>{version}</span>
                                                <button
                                                    onClick={() => handleInstall(version)}
                                                    disabled={installing !== null}
                                                    className={'px-3 py-1.5 text-xs font-medium rounded border-0 cursor-pointer transition-colors duration-150 bg-blue-500/20 text-blue-300 hover:bg-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed'}
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
            </div>
        </ServerContentBlock>
    );
};
