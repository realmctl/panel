import React, { useState, useCallback } from 'react';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { ServerContext } from '@/state/server';
import pullFile from '@/api/server/files/pullFile';
import { useFlashKey } from '@/plugins/useFlash';
import useFlash from '@/plugins/useFlash';
import FlashMessageRender from '@/components/FlashMessageRender';
import Spinner from '@/components/elements/Spinner';
import { debounce } from 'debounce';

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

const card = { backgroundColor: '#192024', border: '1px solid #2d3338' } as React.CSSProperties;
const cardHeader = { backgroundColor: '#0e1417', borderBottom: '1px solid #2d3338' } as React.CSSProperties;
const inputStyle = { backgroundColor: '#0e1417', border: '1px solid #2d3338', color: '#e2e8f0' } as React.CSSProperties;

const SOURCES: { id: Source; label: string }[] = [
    { id: 'hangar', label: 'Hangar' },
    { id: 'modrinth', label: 'Modrinth' },
];

const formatNumber = (n: number) =>
    n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);

export default () => {
    const uuid = ServerContext.useStoreState((s) => s.server.data!.uuid);
    const { clearFlashes, addError, clearAndAddHttpError } = useFlashKey('plugins');
    const { addFlash } = useFlash();

    const [source, setSource] = useState<Source>('hangar');
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<(HangarPlugin | ModrinthPlugin)[]>([]);
    const [searching, setSearching] = useState(false);
    const [installing, setInstalling] = useState<InstallingState | null>(null);
    const [installedSlugs, setInstalledSlugs] = useState<Set<string>>(new Set());

    const search = useCallback(
        debounce(async (q: string, src: Source) => {
            if (!q.trim()) { setResults([]); return; }
            setSearching(true);
            try {
                if (src === 'hangar') {
                    const res = await fetch(
                        `https://hangar.papermc.io/api/v1/projects?limit=20&offset=0&query=${encodeURIComponent(q)}&platform=PAPER`
                    );
                    const data = await res.json();
                    setResults(data.result ?? []);
                } else {
                    const res = await fetch(
                        `https://api.modrinth.com/v2/search?query=${encodeURIComponent(q)}&facets=[[%22project_type:plugin%22]]&limit=20`
                    );
                    const data = await res.json();
                    setResults(data.hits ?? []);
                }
            } catch (e) {
                console.error(e);
                setResults([]);
            } finally {
                setSearching(false);
            }
        }, 500),
        []
    );

    const onQueryChange = (value: string) => {
        setQuery(value);
        search(value, source);
    };

    const onSourceChange = (src: Source) => {
        setSource(src);
        setResults([]);
        setQuery('');
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
            <div
                className={'flex items-center gap-1 p-1 rounded-lg mb-6 w-fit'}
                style={{ backgroundColor: '#0e1417', border: '1px solid #2d3338' }}
            >
                {SOURCES.map((s) => (
                    <button
                        key={s.id}
                        onClick={() => onSourceChange(s.id)}
                        className={'px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-150'}
                        style={
                            source === s.id
                                ? { backgroundColor: '#192024', color: '#e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }
                                : { color: '#64748b' }
                        }
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            {/* Search card */}
            <div className={'rounded-lg overflow-hidden mb-4'} style={card}>
                <div className={'px-4 py-3'} style={cardHeader}>
                    <span className={'text-xs uppercase tracking-wide text-neutral-400'}>
                        Search {source === 'hangar' ? 'Hangar (Paper)' : 'Modrinth'}
                    </span>
                </div>
                <div className={'px-4 py-4'}>
                    <input
                        className={'w-full rounded text-sm px-3 py-2 focus:outline-none transition-colors'}
                        style={inputStyle}
                        placeholder={`Search for plugins... e.g. WorldEdit, EssentialsX`}
                        value={query}
                        onChange={(e) => onQueryChange(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>

            {/* Results */}
            {searching ? (
                <div className={'py-12'}><Spinner centered size={'large'} /></div>
            ) : results.length > 0 ? (
                <div className={'grid grid-cols-1 md:grid-cols-2 gap-3'}>
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
                            <div key={slug} className={'rounded-lg overflow-hidden'} style={card}>
                                {/* Card header */}
                                <div className={'flex items-center justify-between px-4 py-3'} style={cardHeader}>
                                    <div className={'flex items-center gap-2 min-w-0'}>
                                        {avatar && (
                                            <img src={avatar} alt={name} className={'w-5 h-5 rounded object-contain flex-shrink-0'} />
                                        )}
                                        <span className={'text-sm font-medium text-neutral-200 truncate'}>{name}</span>
                                    </div>
                                    <span
                                        className={'text-xs font-mono ml-2 flex-shrink-0'}
                                        style={{ color: '#64748b' }}
                                    >
                                        {formatNumber(downloads)} dl
                                    </span>
                                </div>

                                {/* Body */}
                                <div className={'px-4 py-3'}>
                                    <p className={'text-xs text-neutral-500 line-clamp-2 mb-3'}>{desc}</p>

                                    {/* Version picker / install button */}
                                    {isInstalling ? (
                                        installing.loading ? (
                                            <div className={'flex items-center gap-2 text-xs text-neutral-400'}>
                                                <Spinner size={'small'} />
                                                <span>Loading versions…</span>
                                            </div>
                                        ) : (
                                            <div className={'flex items-center gap-2'}>
                                                <select
                                                    className={'flex-1 rounded text-xs px-2 py-1.5 focus:outline-none'}
                                                    style={inputStyle}
                                                    value={installing.selectedVersion}
                                                    onChange={(e) => onVersionChange(e.target.value)}
                                                >
                                                    {installing.versions.map((v) => (
                                                        <option key={v} value={v}>{v}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={install}
                                                    disabled={!installing.downloadUrl}
                                                    className={'px-3 py-1.5 text-xs font-medium rounded transition-colors duration-150 disabled:opacity-40'}
                                                    style={{ backgroundColor: '#0d2f2a', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}
                                                >
                                                    Install
                                                </button>
                                                <button
                                                    onClick={() => setInstalling(null)}
                                                    className={'px-2 py-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors'}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        )
                                    ) : (
                                        <button
                                            onClick={() => openInstall(plugin)}
                                            disabled={isInstalled}
                                            className={'text-xs px-3 py-1.5 rounded font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-default'}
                                            style={
                                                isInstalled
                                                    ? { backgroundColor: '#0d2f2a', color: '#34d399' }
                                                    : { backgroundColor: '#1e2d38', color: '#94a3b8', border: '1px solid #2d3338' }
                                            }
                                        >
                                            {isInstalled ? 'Installed ✓' : 'Install'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : query.trim() ? (
                <div className={'flex flex-col items-center justify-center py-16'}>
                    <h3 className={'text-base font-semibold text-neutral-100 mb-1'}>No plugins found</h3>
                    <p className={'text-sm text-neutral-500'}>Try a different search term or switch source.</p>
                </div>
            ) : (
                <div className={'flex flex-col items-center justify-center py-16'}>
                    <h3 className={'text-base font-semibold text-neutral-100 mb-1'}>Search for plugins</h3>
                    <p className={'text-sm text-neutral-500'}>Plugins will be installed directly to your server's <code className={'font-mono text-neutral-400'}>/plugins</code> folder.</p>
                </div>
            )}
        </ServerContentBlock>
    );
};
