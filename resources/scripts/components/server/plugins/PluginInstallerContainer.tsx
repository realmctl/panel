import React, { useState, useCallback, useEffect } from 'react';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { ServerContext } from '@/state/server';
import pullFile from '@/api/server/files/pullFile';
import { useFlashKey } from '@/plugins/useFlash';
import useFlash from '@/plugins/useFlash';
import FlashMessageRender from '@/components/FlashMessageRender';
import Spinner from '@/components/elements/Spinner';
import { debounce } from 'debounce';
import classNames from 'classnames';
import RealmCard from '@/components/elements/realm/RealmCard';
import { realmClasses } from '@/lib/realmTokens';

type Source = 'hangar' | 'modrinth';

interface HangarPlugin {
    namespace: { owner: string; slug: string };
    name: string;
    description: string;
    stats: { downloads: number };
    lastUpdated: string;
    avatarUrl?: string;
}

interface ModrinthPlugin {
    project_id: string;
    slug: string;
    title: string;
    description: string;
    downloads: number;
    icon_url?: string;
    versions: string[];
    author: string;
    project_type: string;
}

interface InstallingState {
    slug: string;
    source: Source;
    versions: string[];
    selectedVersion: string;
    downloadUrl: string;
    loading: boolean;
}

const installBtn = {
    backgroundColor: '#1e3a5f',
    color: '#60a5fa',
    border: '1px solid rgba(96,165,250,0.2)',
} as React.CSSProperties;

const installedBtn = {
    backgroundColor: '#0d2f2a',
    color: '#34d399',
    border: '1px solid rgba(52,211,153,0.2)',
} as React.CSSProperties;

const SOURCES: { id: Source; label: string; description: string; icon: string }[] = [
    { id: 'hangar', label: 'Hangar', description: 'PaperMC plugin repository', icon: '/assets/icons/papermc.webp' },
    { id: 'modrinth', label: 'Modrinth', description: 'Open source plugin platform', icon: '/assets/icons/modrinth.svg' },
];

const formatNumber = (n: number) =>
    n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);

const PLUGIN_SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;
const pluginSearchCache = new Map<string, { data: (HangarPlugin | ModrinthPlugin)[]; cachedAt: number }>();

const getPluginSearchCacheKey = (src: Source, q: string) => `${src}:${q.trim().toLowerCase()}`;

const PluginFallbackIcon = () => (
    <div className={'w-8 h-8 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold bg-realm-surface-raised text-realm-muted'}>
        ?
    </div>
);

export default () => {
    const uuid = ServerContext.useStoreState((s) => s.server.data!.uuid);
    const { clearFlashes, clearAndAddHttpError } = useFlashKey('plugins');
    const { addFlash } = useFlash();

    const [source, setSource] = useState<Source>('hangar');
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<(HangarPlugin | ModrinthPlugin)[]>([]);
    const [searching, setSearching] = useState(false);
    const [installing, setInstalling] = useState<InstallingState | null>(null);
    const [installedSlugs, setInstalledSlugs] = useState<Set<string>>(new Set());

    const activeSource = SOURCES.find((s) => s.id === source)!;

    const loadPlugins = useCallback(async (src: Source, q: string) => {
        const cacheKey = getPluginSearchCacheKey(src, q);
        const cached = pluginSearchCache.get(cacheKey);

        if (cached && Date.now() - cached.cachedAt < PLUGIN_SEARCH_CACHE_TTL_MS) {
            setResults(cached.data);
            setSearching(false);
            return;
        }

        setSearching(true);
        try {
            let nextResults: (HangarPlugin | ModrinthPlugin)[] = [];

            if (src === 'hangar') {
                const params = new URLSearchParams({ limit: '20', offset: '0', platform: 'PAPER' });
                if (q.trim()) {
                    params.set('query', q.trim());
                } else {
                    params.set('sort', '-stars');
                }
                const res = await fetch(`https://hangar.papermc.io/api/v1/projects?${params}`);
                const data = await res.json();
                nextResults = data.result ?? [];
            } else {
                const params = new URLSearchParams({
                    limit: '20',
                    facets: '[["project_type:plugin"]]',
                    index: q.trim() ? 'relevance' : 'downloads',
                });
                if (q.trim()) {
                    params.set('query', q.trim());
                }
                const res = await fetch(`https://api.modrinth.com/v2/search?${params}`);
                const data = await res.json();
                nextResults = data.hits ?? [];
            }

            pluginSearchCache.set(cacheKey, { data: nextResults, cachedAt: Date.now() });
            setResults(nextResults);
        } catch (e) {
            console.error(e);
            setResults([]);
        } finally {
            setSearching(false);
        }
    }, []);

    const debouncedSearch = useCallback(
        debounce((q: string, src: Source) => loadPlugins(src, q), 500),
        [loadPlugins]
    );

    useEffect(() => {
        loadPlugins(source, '');
    }, [source, loadPlugins]);

    const onQueryChange = (value: string) => {
        setQuery(value);
        debouncedSearch(value, source);
    };

    const onSourceChange = (src: Source) => {
        setSource(src);
        setQuery('');
        setInstalling(null);
    };

    const openInstall = async (plugin: HangarPlugin | ModrinthPlugin) => {
        const slug = 'namespace' in plugin ? plugin.namespace.slug : plugin.slug;
        setInstalling({ slug, source, versions: [], selectedVersion: '', downloadUrl: '', loading: true });

        try {
            if (source === 'hangar') {
                const p = plugin as HangarPlugin;
                const res = await fetch(
                    `https://hangar.papermc.io/api/v1/projects/${p.namespace.owner}/${p.namespace.slug}/versions?limit=10&offset=0`
                );
                const data = await res.json();
                const versions: string[] = (data.result ?? []).map((v: any) => v.name);
                const first = versions[0] ?? '';
                const downloadUrl = first
                    ? `https://hangar.papermc.io/api/v1/projects/${p.namespace.owner}/${p.namespace.slug}/versions/${first}/PAPER/download`
                    : '';
                setInstalling({ slug, source, versions, selectedVersion: first, downloadUrl, loading: false });
            } else {
                const p = plugin as ModrinthPlugin;
                const res = await fetch(
                    `https://api.modrinth.com/v2/project/${p.project_id}/version?loaders=[%22bukkit%22,%22spigot%22,%22paper%22,%22purpur%22]`
                );
                const data = await res.json();
                const versions = (Array.isArray(data) ? data : []).map((v: any) => v.version_number);
                const first = versions[0] ?? '';
                const downloadUrl = first && Array.isArray(data) && data.length > 0
                    ? data[0]?.files?.[0]?.url ?? ''
                    : '';
                setInstalling({ slug, source, versions, selectedVersion: first, downloadUrl, loading: false });
            }
        } catch (e) {
            console.error(e);
            setInstalling((prev) => prev ? { ...prev, loading: false } : null);
        }
    };

    const onVersionChange = async (version: string) => {
        if (!installing) return;
        setInstalling((prev) => prev ? { ...prev, selectedVersion: version, downloadUrl: '', loading: true } : null);

        try {
            let url = '';
            if (installing.source === 'hangar') {
                const plugin = results.find((p) =>
                    'namespace' in p && p.namespace.slug === installing.slug
                ) as HangarPlugin | undefined;
                if (plugin) {
                    url = `https://hangar.papermc.io/api/v1/projects/${plugin.namespace.owner}/${plugin.namespace.slug}/versions/${version}/PAPER/download`;
                }
            } else {
                const plugin = results.find((p) => !('namespace' in p) && p.slug === installing.slug) as ModrinthPlugin | undefined;
                if (plugin) {
                    const res = await fetch(
                        `https://api.modrinth.com/v2/project/${plugin.project_id}/version?loaders=[%22bukkit%22,%22spigot%22,%22paper%22,%22purpur%22]`
                    );
                    const data = await res.json();
                    const match = Array.isArray(data) ? data.find((v: any) => v.version_number === version) : null;
                    url = match?.files?.[0]?.url ?? '';
                }
            }
            setInstalling((prev) => prev ? { ...prev, selectedVersion: version, downloadUrl: url, loading: false } : null);
        } catch {
            setInstalling((prev) => prev ? { ...prev, loading: false } : null);
        }
    };

    const install = async () => {
        if (!installing?.downloadUrl) return;
        clearFlashes();
        setInstalling((prev) => prev ? { ...prev, loading: true } : null);
        try {
            await pullFile(uuid, installing.downloadUrl, '/plugins');
            setInstalledSlugs((prev) => new Set([...prev, installing.slug]));
            addFlash({ type: 'success', message: 'Plugin installed to /plugins. Restart your server to load it.', key: 'plugins' });
            setInstalling(null);
        } catch (error) {
            clearAndAddHttpError(error instanceof Error ? error : error instanceof String ? String(error) : null);
            setInstalling((prev) => prev ? { ...prev, loading: false } : null);
        }
    };

    return (
        <ServerContentBlock title={'Plugin Installer'}>
            <FlashMessageRender byKey={'plugins'} className={'mb-4'} />

            {/* Source tabs */}
            <div className={classNames('flex items-center gap-1 p-1 rounded-lg mb-6 flex-wrap', realmClasses.tabBar)}>
                {SOURCES.map((s) => {
                    const active = source === s.id;
                    return (
                        <button
                            key={s.id}
                            onClick={() => onSourceChange(s.id)}
                            className={classNames(
                                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 border-0 cursor-pointer',
                                active ? realmClasses.tabActive : realmClasses.tabInactive
                            )}
                        >
                            <img src={s.icon} alt={s.label} className={'w-4 h-4 object-contain flex-shrink-0'} />
                            {s.label}
                        </button>
                    );
                })}
            </div>

            {/* Main card */}
            <RealmCard bodyClassName={'p-0'}>
                <div className={'flex items-center gap-3 px-5 py-3 flex-wrap border-b border-realm-border bg-realm-surface'}>
                    <img src={activeSource.icon} alt={activeSource.label} className={'w-4 h-4 object-contain flex-shrink-0'} />
                    <span className={'text-xs uppercase tracking-wide text-neutral-400'}>{activeSource.label}</span>
                    <span className={'text-neutral-600 text-xs'}>—</span>
                    <span className={'text-xs text-neutral-500'}>{activeSource.description}</span>
                    {results.length > 0 && !searching && (
                        <span className={classNames('ml-auto text-xs px-2 py-0.5 rounded-full font-mono', realmClasses.badge)}>
                            {query.trim() ? `${results.length} results` : `${results.length} popular`}
                        </span>
                    )}
                </div>

                {/* Search */}
                <div className={'px-5 py-4 border-b border-realm-border'}>
                    <input
                        className={`w-full rounded text-sm px-3 py-2.5 focus:outline-none transition-colors ${realmClasses.input}`}
                        placeholder={`Search ${activeSource.label}… e.g. WorldEdit, EssentialsX`}
                        value={query}
                        onChange={(e) => onQueryChange(e.target.value)}
                        autoFocus
                    />
                </div>

                {/* Content */}
                <div className={'p-5'}>
                    {searching ? (
                        <div className={'py-12'}>
                            <Spinner centered size={'large'} />
                        </div>
                    ) : results.length > 0 ? (
                        <div className={'flex flex-col gap-2'}>
                            {results.map((plugin) => {
                                const isHangar = 'namespace' in plugin;
                                const slug = isHangar ? (plugin as HangarPlugin).namespace.slug : (plugin as ModrinthPlugin).slug;
                                const name = isHangar ? (plugin as HangarPlugin).name : (plugin as ModrinthPlugin).title;
                                const desc = plugin.description;
                                const downloads = isHangar
                                    ? (plugin as HangarPlugin).stats.downloads
                                    : (plugin as ModrinthPlugin).downloads;
                                const avatar = isHangar
                                    ? (plugin as HangarPlugin).avatarUrl
                                    : (plugin as ModrinthPlugin).icon_url;
                                const isInstalled = installedSlugs.has(slug);
                                const isInstalling = installing?.slug === slug && installing.source === source;

                                return (
                                    <div
                                        key={slug}
                                        className={classNames('rounded-md px-3 py-3 transition-colors duration-100', realmClasses.row)}
                                    >
                                        <div className={'flex items-start gap-3'}>
                                            {avatar ? (
                                                <img
                                                    src={avatar}
                                                    alt={name}
                                                    className={'w-8 h-8 rounded object-contain flex-shrink-0 bg-realm-surface-raised'}
                                                />
                                            ) : (
                                                <PluginFallbackIcon />
                                            )}

                                            <div className={'flex-1 min-w-0'}>
                                                <div className={'flex items-center justify-between gap-2 mb-1'}>
                                                    <span className={'text-sm font-medium text-neutral-200 truncate'}>{name}</span>
                                                    <span className={'text-xs font-mono flex-shrink-0 text-realm-muted'}>
                                                        {formatNumber(downloads)} downloads
                                                    </span>
                                                </div>
                                                <p className={'text-xs text-neutral-500 line-clamp-2 mb-2'}>{desc}</p>

                                                {isInstalling ? (
                                                    installing.loading ? (
                                                        <div className={'flex items-center gap-2 text-xs text-neutral-400'}>
                                                            <Spinner size={'small'} />
                                                            <span>Loading versions…</span>
                                                        </div>
                                                    ) : (
                                                        <div className={'flex items-center gap-2 flex-wrap'}>
                                                            <select
                                                                className={classNames('rounded text-xs px-2 py-1.5 focus:outline-none min-w-[8rem]', realmClasses.input)}
                                                                value={installing.selectedVersion}
                                                                onChange={(e) => onVersionChange(e.target.value)}
                                                            >
                                                                {installing.versions.map((v) => (
                                                                    <option key={v} value={v}>{v}</option>
                                                                ))}
                                                            </select>
                                                            <button
                                                                onClick={install}
                                                                disabled={!installing.downloadUrl || installing.loading}
                                                                className={'px-2.5 py-1 text-xs font-medium rounded transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed'}
                                                                style={installBtn}
                                                            >
                                                                {installing.loading ? 'Installing…' : 'Install'}
                                                            </button>
                                                            <button
                                                                onClick={() => setInstalling(null)}
                                                                className={'px-2 py-1 text-xs text-neutral-500 hover:text-neutral-300 transition-colors'}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    )
                                                ) : (
                                                    <button
                                                        onClick={() => openInstall(plugin)}
                                                        disabled={isInstalled}
                                                        className={'px-2.5 py-1 text-xs font-medium rounded transition-colors duration-150 disabled:opacity-50 disabled:cursor-default'}
                                                        style={isInstalled ? installedBtn : installBtn}
                                                    >
                                                        {isInstalled ? 'Installed ✓' : 'Install'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className={'flex flex-col items-center justify-center py-12'}>
                            <img src={activeSource.icon} alt={''} className={'w-8 h-8 object-contain opacity-30 mb-3'} />
                            <h3 className={'text-base font-semibold text-neutral-100 mb-1'}>No plugins found</h3>
                            <p className={'text-sm text-neutral-500'}>Try a different search term or switch source.</p>
                        </div>
                    )}
                </div>
            </RealmCard>
        </ServerContentBlock>
    );
};
