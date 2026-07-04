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
import { realmClasses } from '@/lib/realmTokens';
import styles from './style.module.css';
import {
    faArrowLeft,
    faCheck,
    faChevronLeft,
    faChevronRight,
    faDownload,
    faSearch,
    faUser,
} from '@fortawesome/free-solid-svg-icons';
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

const SOURCES: { id: Source; label: string; description: string; icon: string }[] = [
    { id: 'hangar', label: 'Hangar', description: 'PaperMC plugin repository', icon: '/assets/icons/papermc.webp' },
    { id: 'modrinth', label: 'Modrinth', description: 'Open source plugin platform', icon: '/assets/icons/modrinth.svg' },
];

const formatNumber = (n: number) =>
    n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);

const PLUGIN_SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;
const PAGE_SIZE = 20;
const pluginSearchCache = new Map<
    string,
    { data: (HangarPlugin | ModrinthPlugin)[]; total: number; cachedAt: number }
>();

const getPluginSearchCacheKey = (src: Source, q: string, page: number) => `${src}:${page}:${q.trim().toLowerCase()}`;

const isHangarPlugin = (plugin: HangarPlugin | ModrinthPlugin): plugin is HangarPlugin => 'namespace' in plugin;

const getPluginSlug = (plugin: HangarPlugin | ModrinthPlugin) =>
    isHangarPlugin(plugin) ? plugin.namespace.slug : plugin.slug;

const getPluginName = (plugin: HangarPlugin | ModrinthPlugin) =>
    isHangarPlugin(plugin) ? plugin.name : plugin.title;

const getPluginAvatar = (plugin: HangarPlugin | ModrinthPlugin) =>
    isHangarPlugin(plugin) ? plugin.avatarUrl : plugin.icon_url;

const getPluginDownloads = (plugin: HangarPlugin | ModrinthPlugin) =>
    isHangarPlugin(plugin) ? plugin.stats.downloads : plugin.downloads;

const getPluginAuthor = (plugin: HangarPlugin | ModrinthPlugin) =>
    isHangarPlugin(plugin) ? plugin.namespace.owner : plugin.author;

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
            large ? 'w-14 h-14 text-lg' : 'w-10 h-10 text-xs'
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
    const [totalResults, setTotalResults] = useState(0);
    const [page, setPage] = useState(0);
    const [searching, setSearching] = useState(false);
    const [selectedPlugin, setSelectedPlugin] = useState<HangarPlugin | ModrinthPlugin | null>(null);
    const [pluginDetail, setPluginDetail] = useState<PluginDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [installing, setInstalling] = useState<InstallingState | null>(null);
    const [installedSlugs, setInstalledSlugs] = useState<Set<string>>(new Set());

    const activeSource = SOURCES.find((s) => s.id === source)!;

    const loadPlugins = useCallback(async (src: Source, q: string, pageIndex: number) => {
        const cacheKey = getPluginSearchCacheKey(src, q, pageIndex);
        const cached = pluginSearchCache.get(cacheKey);

        if (cached && Date.now() - cached.cachedAt < PLUGIN_SEARCH_CACHE_TTL_MS) {
            setResults(cached.data);
            setTotalResults(cached.total);
            setSearching(false);
            return;
        }

        setSearching(true);
        try {
            let nextResults: (HangarPlugin | ModrinthPlugin)[] = [];
            let total = 0;
            const offset = String(pageIndex * PAGE_SIZE);

            if (src === 'hangar') {
                const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset, platform: 'PAPER' });
                if (q.trim()) {
                    params.set('query', q.trim());
                } else {
                    params.set('sort', '-stars');
                }
                const res = await fetch(`https://hangar.papermc.io/api/v1/projects?${params}`);
                const data = await res.json();
                nextResults = data.result ?? [];
                total = data.pagination?.count ?? nextResults.length;
            } else {
                const params = new URLSearchParams({
                    limit: String(PAGE_SIZE),
                    offset,
                    facets: '[["project_type:plugin"]]',
                    index: q.trim() ? 'relevance' : 'downloads',
                });
                if (q.trim()) {
                    params.set('query', q.trim());
                }
                const res = await fetch(`https://api.modrinth.com/v2/search?${params}`);
                const data = await res.json();
                nextResults = data.hits ?? [];
                total = data.total_hits ?? nextResults.length;
            }

            pluginSearchCache.set(cacheKey, { data: nextResults, total, cachedAt: Date.now() });
            setResults(nextResults);
            setTotalResults(total);
        } catch (e) {
            console.error(e);
            setResults([]);
            setTotalResults(0);
        } finally {
            setSearching(false);
        }
    }, []);

    const debouncedSearch = useCallback(
        debounce((q: string, src: Source) => loadPlugins(src, q, 0), 500),
        [loadPlugins]
    );

    useEffect(() => {
        loadPlugins(source, '', 0);
    }, [source, loadPlugins]);

    const onQueryChange = (value: string) => {
        setQuery(value);
        setPage(0);
        debouncedSearch(value, source);
    };

    const onSourceChange = (src: Source) => {
        setSource(src);
        setQuery('');
        setPage(0);
        setSelectedPlugin(null);
        setPluginDetail(null);
        setInstalling(null);
    };

    const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));

    const goToPage = (pageIndex: number) => {
        const next = Math.max(0, Math.min(pageIndex, totalPages - 1));
        if (next === page) return;
        setPage(next);
        loadPlugins(source, query, next);
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
        !selectedPlugin && results.length > 0 && !searching && query.trim()
            ? `${formatNumber(totalResults)} results`
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

        const stats: React.ReactNode[] = [];
        if (pluginDetail?.owner) {
            stats.push(<span key={'owner'}>by {pluginDetail.owner}</span>);
        }
        stats.push(<span key={'downloads'}>{formatNumber(downloads)} downloads</span>);
        if (pluginDetail?.stars != null) {
            stats.push(<span key={'stars'}>{formatNumber(pluginDetail.stars)} stars</span>);
        }
        if (pluginDetail?.lastUpdated) {
            stats.push(<span key={'updated'}>Updated {new Date(pluginDetail.lastUpdated).toLocaleDateString()}</span>);
        }

        return (
            <>
                <button type={'button'} onClick={closeDetail} className={styles.detail_back}>
                    <FontAwesomeIcon icon={faArrowLeft} />
                    Back to plugins
                </button>

                <div className={styles.detail_card}>
                    <div className={styles.detail_header}>
                        {avatar ? (
                            <img src={avatar} alt={name} className={styles.detail_icon} />
                        ) : (
                            <PluginFallbackIcon large />
                        )}
                        <div className={'flex-1 min-w-0'}>
                            <h3 className={styles.detail_title}>{name}</h3>
                            <div className={styles.detail_stats}>
                                {stats.map((stat, index) => (
                                    <React.Fragment key={index}>
                                        {index > 0 && <span className={styles.detail_stat_dot}>•</span>}
                                        {stat}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                        <div className={'flex-shrink-0'}>
                            <img
                                src={activeSource.icon}
                                alt={activeSource.label}
                                title={activeSource.label}
                                className={'w-5 h-5 object-contain opacity-60'}
                            />
                        </div>
                    </div>

                    <div className={styles.detail_body}>
                        <p className={styles.detail_desc}>{description}</p>

                        {detailLoading || installing.loading ? (
                            <div className={'flex items-center gap-2 text-sm text-neutral-400 py-2'}>
                                <Spinner size={'small'} />
                                <span>Loading versions…</span>
                            </div>
                        ) : installing.versions.length === 0 ? (
                            <p className={'text-sm text-neutral-500 m-0'}>No versions available for Paper.</p>
                        ) : (
                            <div className={styles.detail_install}>
                                <span className={styles.detail_install_label}>Install version</span>
                                <div className={styles.detail_install_row}>
                                    <select
                                        className={classNames(
                                            'rounded-md text-sm px-3 py-2 focus:outline-none min-w-[12rem] max-w-full',
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
                                        className={classNames(
                                            styles.install_button,
                                            isInstalled && styles.install_button_installed
                                        )}
                                    >
                                        {installing.loading ? 'Installing…' : isInstalled ? 'Installed ✓' : 'Install to server'}
                                    </button>
                                </div>
                                {installing.externalUrl &&
                                    !installing.versions.find((v) => v.name === installing.selectedVersion)
                                        ?.downloadUrl && (
                                        <p className={'text-xs text-neutral-500 m-0'}>
                                            This version is hosted externally.{' '}
                                            <a
                                                href={installing.externalUrl}
                                                target={'_blank'}
                                                rel={'noopener noreferrer'}
                                                className={styles.detail_link}
                                            >
                                                Download from publisher
                                            </a>
                                        </p>
                                    )}
                            </div>
                        )}

                        <div className={styles.detail_links}>
                            <a
                                href={externalPageUrl}
                                target={'_blank'}
                                rel={'noopener noreferrer'}
                                className={styles.detail_link}
                            >
                                View on {activeSource.label} →
                            </a>
                            {pluginDetail?.wikiUrl && (
                                <a
                                    href={pluginDetail.wikiUrl}
                                    target={'_blank'}
                                    rel={'noopener noreferrer'}
                                    className={styles.detail_link}
                                >
                                    Wiki →
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </>
        );
    };

    const renderList = () => (
        <>
            <div className={styles.toolbar}>
                <div className={classNames('flex items-center gap-1 p-1 rounded-md flex-shrink-0', realmClasses.tabBar)}>
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
                <div className={styles.search_wrap}>
                    <FontAwesomeIcon icon={faSearch} className={styles.search_icon} />
                    <input
                        className={classNames(realmClasses.input, styles.search)}
                        placeholder={`Search ${activeSource.label}…`}
                        value={query}
                        onChange={(e) => onQueryChange(e.target.value)}
                        autoFocus
                    />
                </div>
                {listBadge && <span className={styles.count}>{listBadge}</span>}
            </div>

            {searching ? (
                <div className={styles.state_block}>
                    <Spinner centered size={'large'} />
                </div>
            ) : results.length > 0 ? (
                <div className={styles.plugin_grid}>
                    {results.map((plugin) => {
                        const slug = getPluginSlug(plugin);
                        const name = getPluginName(plugin);
                        const desc = plugin.description;
                        const downloads = getPluginDownloads(plugin);
                        const author = getPluginAuthor(plugin);
                        const avatar = getPluginAvatar(plugin);
                        const isInstalled = installedSlugs.has(slug);

                        return (
                            <button
                                key={slug}
                                type={'button'}
                                onClick={() => openDetail(plugin)}
                                className={styles.card}
                            >
                                <div className={styles.card_header}>
                                    {avatar ? (
                                        <img src={avatar} alt={name} className={styles.card_icon} />
                                    ) : (
                                        <PluginFallbackIcon />
                                    )}
                                    <div className={'flex-1 min-w-0'}>
                                        <p className={styles.card_name}>{name}</p>
                                        <p className={styles.card_meta}>
                                            <FontAwesomeIcon icon={faUser} className={styles.card_meta_icon} />
                                            <span className={'truncate'}>{author}</span>
                                        </p>
                                    </div>
                                </div>

                                <p className={styles.card_desc}>{desc}</p>

                                <div className={styles.card_footer}>
                                    <span className={styles.card_source}>
                                        <FontAwesomeIcon icon={faDownload} className={styles.card_meta_icon} />
                                        {formatNumber(downloads)}
                                    </span>
                                    {isInstalled ? (
                                        <span className={styles.installed_badge}>
                                            <FontAwesomeIcon icon={faCheck} className={'text-[10px]'} />
                                            Installed
                                        </span>
                                    ) : (
                                        <span className={styles.install_badge}>Install</span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            ) : (
                <div className={styles.state_block}>
                    <img src={activeSource.icon} alt={''} className={'w-8 h-8 object-contain opacity-30 mb-3'} />
                    <h3 className={'text-base font-semibold text-neutral-100 mb-1 m-0'}>No plugins found</h3>
                    <p className={'text-sm text-neutral-500 m-0'}>Try a different search term or switch source.</p>
                </div>
            )}

            {!searching && results.length > 0 && totalPages > 1 && (
                <div className={styles.pagination}>
                    <button
                        type={'button'}
                        className={styles.pagination_button}
                        onClick={() => goToPage(page - 1)}
                        disabled={page === 0}
                    >
                        <FontAwesomeIcon icon={faChevronLeft} className={'text-[10px]'} />
                        Previous
                    </button>
                    <span className={styles.pagination_label}>
                        Page {page + 1} of {formatNumber(totalPages)}
                    </span>
                    <button
                        type={'button'}
                        className={styles.pagination_button}
                        onClick={() => goToPage(page + 1)}
                        disabled={page >= totalPages - 1}
                    >
                        Next
                        <FontAwesomeIcon icon={faChevronRight} className={'text-[10px]'} />
                    </button>
                </div>
            )}
        </>
    );

    return (
        <ServerContentBlock title={'Plugins'}>
            <FlashMessageRender byKey={'plugins'} className={'mb-4'} />

            {selectedPlugin ? renderDetail() : renderList()}
        </ServerContentBlock>
    );
};
