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
import RealmCardSourceHeader from '@/components/elements/realm/RealmCardSourceHeader';
import { realmClasses } from '@/lib/realmTokens';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type Source = 'hangar' | 'modrinth';

interface HangarPlugin {
    namespace: { owner: string; slug: string };
    name: string;
    description: string;
    stats: { downloads: number; stars?: number; views?: number };
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

interface VersionOption {
    name: string;
    downloadUrl: string | null;
    externalUrl?: string | null;
}

interface PluginDetail {
    description: string;
    sourceUrl: string | null;
    wikiUrl: string | null;
    owner: string;
    stars: number | null;
    lastUpdated: string | null;
}

interface InstallingState {
    slug: string;
    source: Source;
    versions: VersionOption[];
    selectedVersion: string;
    downloadUrl: string;
    externalUrl: string | null;
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

const isHangarPlugin = (plugin: HangarPlugin | ModrinthPlugin): plugin is HangarPlugin => 'namespace' in plugin;

const getPluginSlug = (plugin: HangarPlugin | ModrinthPlugin) =>
    isHangarPlugin(plugin) ? plugin.namespace.slug : plugin.slug;

const getPluginName = (plugin: HangarPlugin | ModrinthPlugin) =>
    isHangarPlugin(plugin) ? plugin.name : plugin.title;

const getPluginAvatar = (plugin: HangarPlugin | ModrinthPlugin) =>
    isHangarPlugin(plugin) ? plugin.avatarUrl : plugin.icon_url;

const getPluginDownloads = (plugin: HangarPlugin | ModrinthPlugin) =>
    isHangarPlugin(plugin) ? plugin.stats.downloads : plugin.downloads;

const mapHangarVersions = (result: any[]): VersionOption[] =>
    result.map((v) => {
        const paper = v.downloads?.PAPER ?? {};
        return {
            name: v.name as string,
            downloadUrl: paper.downloadUrl ?? null,
            externalUrl: paper.externalUrl ?? null,
        };
    });

const hangarDownloadUrl = (directUrl: string | null) => directUrl ?? '';

const PluginFallbackIcon = ({ large = false }: { large?: boolean }) => (
    <div
        className={classNames(
            'rounded flex items-center justify-center flex-shrink-0 font-bold bg-realm-surface-raised text-realm-muted',
            large ? 'w-14 h-14 text-lg' : 'w-8 h-8 text-xs'
        )}
    >
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
    const [selectedPlugin, setSelectedPlugin] = useState<HangarPlugin | ModrinthPlugin | null>(null);
    const [pluginDetail, setPluginDetail] = useState<PluginDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
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
        setSelectedPlugin(null);
        setPluginDetail(null);
        setInstalling(null);
    };

    const closeDetail = () => {
        setSelectedPlugin(null);
        setPluginDetail(null);
        setInstalling(null);
    };

    const openDetail = async (plugin: HangarPlugin | ModrinthPlugin) => {
        const slug = getPluginSlug(plugin);
        setSelectedPlugin(plugin);
        setPluginDetail(null);
        setDetailLoading(true);
        setInstalling({
            slug,
            source,
            versions: [],
            selectedVersion: '',
            downloadUrl: '',
            externalUrl: null,
            loading: true,
        });

        try {
            if (source === 'hangar') {
                const p = plugin as HangarPlugin;
                const [versionsRes, projectRes] = await Promise.all([
                    fetch(
                        `https://hangar.papermc.io/api/v1/projects/${p.namespace.owner}/${p.namespace.slug}/versions?limit=25&offset=0&platform=PAPER`
                    ),
                    fetch(`https://hangar.papermc.io/api/v1/projects/${p.namespace.owner}/${p.namespace.slug}`),
                ]);
                const versionsData = await versionsRes.json();
                const projectData = await projectRes.json();
                const versions = mapHangarVersions(versionsData.result ?? []);
                const first = versions[0];

                setPluginDetail({
                    description: projectData.description ?? p.description,
                    sourceUrl: `https://hangar.papermc.io/${p.namespace.owner}/${p.namespace.slug}`,
                    wikiUrl: null,
                    owner: p.namespace.owner,
                    stars: projectData.stats?.stars ?? p.stats.stars ?? null,
                    lastUpdated: projectData.lastUpdated ?? p.lastUpdated,
                });
                setInstalling({
                    slug,
                    source,
                    versions,
                    selectedVersion: first?.name ?? '',
                    downloadUrl: first ? hangarDownloadUrl(first.downloadUrl) : '',
                    externalUrl: first?.externalUrl ?? null,
                    loading: false,
                });
            } else {
                const p = plugin as ModrinthPlugin;
                const [versionsRes, projectRes] = await Promise.all([
                    fetch(
                        `https://api.modrinth.com/v2/project/${p.project_id}/version?loaders=[%22bukkit%22,%22spigot%22,%22paper%22,%22purpur%22]`
                    ),
                    fetch(`https://api.modrinth.com/v2/project/${p.project_id}`),
                ]);
                const versionsData = await versionsRes.json();
                const projectData = await projectRes.json();
                const versions: VersionOption[] = (Array.isArray(versionsData) ? versionsData : []).map((v: any) => ({
                    name: v.version_number,
                    downloadUrl: v.files?.[0]?.url ?? null,
                }));
                const first = versions[0];

                setPluginDetail({
                    description: projectData.description ?? p.description,
                    sourceUrl: projectData.source_url ?? `https://modrinth.com/plugin/${p.slug}`,
                    wikiUrl: projectData.wiki_url ?? null,
                    owner: p.author,
                    stars: null,
                    lastUpdated: null,
                });
                setInstalling({
                    slug,
                    source,
                    versions,
                    selectedVersion: first?.name ?? '',
                    downloadUrl: first?.downloadUrl ?? '',
                    externalUrl: null,
                    loading: false,
                });
            }
        } catch (e) {
            console.error(e);
            setInstalling((prev) => (prev ? { ...prev, loading: false } : null));
        } finally {
            setDetailLoading(false);
        }
    };

    const onVersionChange = (version: string) => {
        if (!installing) return;

        const match = installing.versions.find((v) => v.name === version);
        if (!match) return;

        if (installing.source === 'hangar') {
            setInstalling((prev) =>
                prev
                    ? {
                          ...prev,
                          selectedVersion: version,
                          downloadUrl: hangarDownloadUrl(match.downloadUrl),
                          externalUrl: match.externalUrl ?? null,
                          loading: false,
                      }
                    : null
            );
            return;
        }

        setInstalling((prev) =>
            prev
                ? {
                      ...prev,
                      selectedVersion: version,
                      downloadUrl: match.downloadUrl ?? '',
                      externalUrl: null,
                      loading: false,
                  }
                : null
        );
    };

    const install = async () => {
        if (!installing?.downloadUrl) return;
        clearFlashes();
        setInstalling((prev) => (prev ? { ...prev, loading: true } : null));
        try {
            await pullFile(uuid, installing.downloadUrl, '/plugins');
            setInstalledSlugs((prev) => new Set([...prev, installing.slug]));
            addFlash({
                type: 'success',
                message: 'Plugin installed to /plugins. Restart your server to load it.',
                key: 'plugins',
            });
            setInstalling((prev) => (prev ? { ...prev, loading: false } : null));
        } catch (error) {
            clearAndAddHttpError(error instanceof Error ? error : error instanceof String ? String(error) : null);
            setInstalling((prev) => (prev ? { ...prev, loading: false } : null));
        }
    };

    const listBadge =
        !selectedPlugin && results.length > 0 && !searching
            ? query.trim()
                ? `${results.length} results`
                : `${results.length} popular`
            : undefined;

    const renderDetail = () => {
        if (!selectedPlugin || !installing) return null;

        const name = getPluginName(selectedPlugin);
        const avatar = getPluginAvatar(selectedPlugin);
        const downloads = getPluginDownloads(selectedPlugin);
        const isInstalled = installedSlugs.has(installing.slug);
        const description = pluginDetail?.description ?? selectedPlugin.description;
        const externalPageUrl =
            pluginDetail?.sourceUrl ??
            (isHangarPlugin(selectedPlugin)
                ? `https://hangar.papermc.io/${selectedPlugin.namespace.owner}/${selectedPlugin.namespace.slug}`
                : `https://modrinth.com/plugin/${selectedPlugin.slug}`);

        return (
            <div className={'flex flex-col gap-5'}>
                <button
                    type={'button'}
                    onClick={closeDetail}
                    className={
                        'flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors self-start border-0 bg-transparent p-0 cursor-pointer'
                    }
                >
                    <FontAwesomeIcon icon={faArrowLeft} />
                    Back to plugins
                </button>

                <div className={'flex items-start gap-4'}>
                    {avatar ? (
                        <img
                            src={avatar}
                            alt={name}
                            className={'w-14 h-14 rounded object-contain flex-shrink-0 bg-realm-surface-raised'}
                        />
                    ) : (
                        <PluginFallbackIcon large />
                    )}
                    <div className={'flex-1 min-w-0'}>
                        <h3 className={'text-lg font-semibold text-neutral-100 m-0 mb-1'}>{name}</h3>
                        <div className={'flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500'}>
                            {pluginDetail?.owner && <span>by {pluginDetail.owner}</span>}
                            <span>{formatNumber(downloads)} downloads</span>
                            {pluginDetail?.stars != null && <span>{formatNumber(pluginDetail.stars)} stars</span>}
                            {pluginDetail?.lastUpdated && (
                                <span>Updated {new Date(pluginDetail.lastUpdated).toLocaleDateString()}</span>
                            )}
                        </div>
                    </div>
                </div>

                <p className={'text-sm text-neutral-400 m-0 leading-relaxed'}>{description}</p>

                {detailLoading || installing.loading ? (
                    <div className={'flex items-center gap-2 text-sm text-neutral-400 py-2'}>
                        <Spinner size={'small'} />
                        <span>Loading versions…</span>
                    </div>
                ) : installing.versions.length === 0 ? (
                    <p className={'text-sm text-neutral-500 m-0'}>No versions available for Paper.</p>
                ) : (
                    <div
                        className={classNames(
                            'rounded-md p-4 flex flex-col gap-3',
                            realmClasses.insetPanel
                        )}
                    >
                        <span className={'text-xs font-medium uppercase tracking-wide text-neutral-400'}>Install version</span>
                        <div className={'flex items-center gap-2 flex-wrap'}>
                            <select
                                className={classNames(
                                    'rounded text-sm px-3 py-2 focus:outline-none min-w-[12rem] max-w-full',
                                    realmClasses.input
                                )}
                                value={installing.selectedVersion}
                                onChange={(e) => onVersionChange(e.target.value)}
                            >
                                {installing.versions.map((v) => (
                                    <option key={v.name} value={v.name}>
                                        {v.name}
                                        {!v.downloadUrl && v.externalUrl ? ' (external)' : ''}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={install}
                                disabled={!installing.downloadUrl || installing.loading || isInstalled}
                                className={
                                    'px-3 py-2 text-sm font-medium rounded transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed'
                                }
                                style={isInstalled ? installedBtn : installBtn}
                            >
                                {installing.loading ? 'Installing…' : isInstalled ? 'Installed ✓' : 'Install to server'}
                            </button>
                        </div>
                        {installing.externalUrl &&
                            !installing.versions.find((v) => v.name === installing.selectedVersion)?.downloadUrl && (
                                <p className={'text-xs text-neutral-500 m-0'}>
                                    This version is hosted externally.{' '}
                                    <a
                                        href={installing.externalUrl}
                                        target={'_blank'}
                                        rel={'noopener noreferrer'}
                                        className={'text-blue-400 hover:text-blue-300 no-underline'}
                                    >
                                        Download from publisher
                                    </a>
                                </p>
                            )}
                    </div>
                )}

                <div className={'flex flex-wrap gap-4 text-xs'}>
                    <a
                        href={externalPageUrl}
                        target={'_blank'}
                        rel={'noopener noreferrer'}
                        className={'text-blue-400 hover:text-blue-300 no-underline'}
                    >
                        View on {activeSource.label} →
                    </a>
                    {pluginDetail?.wikiUrl && (
                        <a
                            href={pluginDetail.wikiUrl}
                            target={'_blank'}
                            rel={'noopener noreferrer'}
                            className={'text-blue-400 hover:text-blue-300 no-underline'}
                        >
                            Wiki →
                        </a>
                    )}
                </div>
            </div>
        );
    };

    const renderList = () => (
        <>
            <div className={'px-5 py-4 border-b border-realm-border'}>
                <input
                    className={`w-full rounded text-sm px-3 py-2.5 focus:outline-none transition-colors ${realmClasses.input}`}
                    placeholder={`Search ${activeSource.label}… e.g. WorldEdit, EssentialsX`}
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                    autoFocus
                />
            </div>

            <div className={'p-5'}>
                {searching ? (
                    <div className={'py-12'}>
                        <Spinner centered size={'large'} />
                    </div>
                ) : results.length > 0 ? (
                    <div className={'flex flex-col gap-2'}>
                        {results.map((plugin) => {
                            const slug = getPluginSlug(plugin);
                            const name = getPluginName(plugin);
                            const desc = plugin.description;
                            const downloads = getPluginDownloads(plugin);
                            const avatar = getPluginAvatar(plugin);
                            const isInstalled = installedSlugs.has(slug);

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
                                                <button
                                                    type={'button'}
                                                    onClick={() => openDetail(plugin)}
                                                    className={
                                                        'text-sm font-medium text-neutral-200 truncate text-left border-0 bg-transparent p-0 cursor-pointer hover:text-blue-400 transition-colors'
                                                    }
                                                >
                                                    {name}
                                                </button>
                                                <span className={'text-xs font-mono flex-shrink-0 text-realm-muted'}>
                                                    {formatNumber(downloads)} downloads
                                                </span>
                                            </div>
                                            <p className={'text-xs text-neutral-500 line-clamp-2 mb-2'}>{desc}</p>
                                            <button
                                                onClick={() => openDetail(plugin)}
                                                disabled={isInstalled}
                                                className={
                                                    'px-2.5 py-1 text-xs font-medium rounded transition-colors duration-150 disabled:opacity-50 disabled:cursor-default'
                                                }
                                                style={isInstalled ? installedBtn : installBtn}
                                            >
                                                {isInstalled ? 'Installed ✓' : 'View & install'}
                                            </button>
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
        </>
    );

    return (
        <ServerContentBlock title={'Plugin Installer'}>
            <FlashMessageRender byKey={'plugins'} className={'mb-4'} />

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

            <RealmCard
                bodyClassName={'p-0'}
                header={
                    <RealmCardSourceHeader
                        label={activeSource.label}
                        description={activeSource.description}
                        icon={activeSource.icon}
                        badge={listBadge}
                    />
                }
                headerClassName={'px-5 py-3'}
            >
                {selectedPlugin ? <div className={'p-5'}>{renderDetail()}</div> : renderList()}
            </RealmCard>
        </ServerContentBlock>
    );
};
