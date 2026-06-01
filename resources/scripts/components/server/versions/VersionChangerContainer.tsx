import React, { useEffect, useState } from 'react';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { ServerContext } from '@/state/server';
import getVersions from '@/api/server/versions/getVersions';
import installVersion, { InstallResponse } from '@/api/server/versions/installVersion';
import Spinner from '@/components/elements/Spinner';

const SERVER_TYPES = [
    { id: 'paper', name: 'Paper', description: 'High performance Minecraft server', icon: 'https://docs.papermc.io/img/paper.png' },
    { id: 'purpur', name: 'Purpur', description: 'Paper fork with extra features', icon: 'https://purpurmc.org/docs/images/purpur-small.png' },
    { id: 'vanilla', name: 'Vanilla', description: 'Official Mojang server', icon: 'https://www.minecraft.net/etc.clientlibs/minecraft/clientlibs/main/resources/favicon-32x32.png' },
    { id: 'spigot', name: 'Spigot', description: 'Modified Minecraft server', icon: 'https://static.spigotmc.org/img/spigot.png' },
    { id: 'fabric', name: 'Fabric', description: 'Lightweight modding platform', icon: 'https://fabricmc.net/assets/logo.png' },
    { id: 'velocity', name: 'Velocity', description: 'Modern proxy server', icon: 'https://docs.papermc.io/img/velocity.png' },
    { id: 'waterfall', name: 'Waterfall', description: 'BungeeCord fork by PaperMC', icon: 'https://docs.papermc.io/img/waterfall.png' },
    { id: 'snapshot', name: 'Snapshot', description: 'Vanilla development versions', icon: 'https://www.minecraft.net/etc.clientlibs/minecraft/clientlibs/main/resources/favicon-32x32.png' },
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
            .catch((err) => setError('Installation failed. Make sure the server is offline.'))
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
                            {SERVER_TYPES.map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => setSelectedType(type.id)}
                                    className={`w-full text-left px-3 py-2.5 rounded-md text-sm border-0 cursor-pointer transition-colors duration-150 flex items-center gap-3 ${
                                        selectedType === type.id
                                            ? 'bg-blue-500/20 text-blue-300'
                                            : 'bg-transparent text-neutral-300 hover:bg-neutral-700/40 hover:text-neutral-100'
                                    }`}
                                >
                                    <img src={type.icon} alt={type.name} className={'w-5 h-5 rounded-sm object-contain'} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                    <div>
                                        <div className={'font-medium'}>{type.name}</div>
                                        <div className={'text-xs text-neutral-500 mt-0.5'}>{type.description}</div>
                                    </div>
                                </button>
                            ))}
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
