import React, { useEffect, useMemo, useState } from 'react';
import { useActivityLogs } from '@/api/server/activity';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { useFlashKey } from '@/plugins/useFlash';
import FlashMessageRender from '@/components/FlashMessageRender';
import Spinner from '@/components/elements/Spinner';
import ActivityLogEntry from '@/components/elements/activity/ActivityLogEntry';
import PaginationFooter from '@/components/elements/table/PaginationFooter';
import { ActivityLogFilters } from '@/api/account/activity';
import { Link } from 'react-router-dom';
import { XCircleIcon, FilterIcon } from '@heroicons/react/solid';
import useLocationHash from '@/plugins/useLocationHash';

const card  = { backgroundColor: '#192024', border: '1px solid #2d3338' } as React.CSSProperties;
const input = { backgroundColor: '#0e1417', border: '1px solid #2d3338', color: '#e2e8f0' } as React.CSSProperties;

export default () => {
    const { hash } = useLocationHash();
    const { clearAndAddHttpError } = useFlashKey('server:activity');
    const [filters, setFilters] = useState<ActivityLogFilters>({ page: 1, sorts: { timestamp: -1 } });
    const [eventInput, setEventInput] = useState('');
    const [ipInput, setIpInput]       = useState('');

    const { data, isValidating, error } = useActivityLogs(filters, {
        revalidateOnMount: true,
        revalidateOnFocus: false,
    });

    useEffect(() => {
        setFilters((v) => ({ ...v, filters: { ip: hash.ip, event: hash.event } }));
        setEventInput(hash.event || '');
        setIpInput(hash.ip || '');
    }, [hash]);

    useEffect(() => { clearAndAddHttpError(error); }, [error]);

    // Unique events from the current page for quick-select chips.
    const uniqueEvents = useMemo(() => {
        if (!data?.items) return [];
        return [...new Set(data.items.map((a) => a.event))].sort();
    }, [data?.items]);

    const applyFilters = (event?: string, ip?: string) => {
        setFilters((v) => ({
            ...v,
            page: 1,
            filters: {
                event: (event ?? eventInput) || undefined,
                ip:    (ip    ?? ipInput)    || undefined,
            },
        }));
    };

    const clearAll = () => {
        setEventInput('');
        setIpInput('');
        setFilters((v) => ({ ...v, page: 1, filters: {} }));
    };

    const activeEvent = filters.filters?.event;
    const activeIp    = filters.filters?.ip;
    const hasFilters  = activeEvent || activeIp;

    return (
        <ServerContentBlock title={'Activity Log'}>
            <FlashMessageRender byKey={'server:activity'} className={'mb-4'} />

            <div className={'flex gap-5 items-start'}>
                {/* ── Sidebar ── */}
                <aside className={'hidden md:flex flex-col gap-4 w-56 flex-shrink-0'}>
                    {/* Filter header */}
                    <div
                        className={'rounded-lg overflow-hidden'}
                        style={card}
                    >
                        <div
                            className={'flex items-center gap-2 px-4 py-3'}
                            style={{ backgroundColor: '#0e1417', borderBottom: '1px solid #2d3338' }}
                        >
                            <FilterIcon className={'w-3.5 h-3.5 text-neutral-400'} />
                            <span className={'text-xs uppercase tracking-wide text-neutral-400'}>Filters</span>
                            {hasFilters && (
                                <button
                                    onClick={clearAll}
                                    className={'ml-auto text-xs text-neutral-500 hover:text-red-400 transition-colors flex items-center gap-1'}
                                >
                                    <XCircleIcon className={'w-3.5 h-3.5'} />
                                    Clear
                                </button>
                            )}
                        </div>

                        <div className={'px-4 py-4 flex flex-col gap-4'}>
                            {/* Event filter */}
                            <div>
                                <label className={'block text-xs uppercase tracking-wide text-neutral-500 mb-1.5'}>
                                    Event
                                </label>
                                <input
                                    className={'w-full rounded text-xs px-2.5 py-1.5 focus:outline-none transition-colors'}
                                    style={input}
                                    placeholder={'e.g. server:power'}
                                    value={eventInput}
                                    onChange={(e) => setEventInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && applyFilters(eventInput)}
                                />
                            </div>

                            {/* IP filter */}
                            <div>
                                <label className={'block text-xs uppercase tracking-wide text-neutral-500 mb-1.5'}>
                                    IP Address
                                </label>
                                <input
                                    className={'w-full rounded text-xs px-2.5 py-1.5 focus:outline-none transition-colors'}
                                    style={input}
                                    placeholder={'e.g. 192.168.1.1'}
                                    value={ipInput}
                                    onChange={(e) => setIpInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && applyFilters(undefined, ipInput)}
                                />
                            </div>

                            <button
                                onClick={() => applyFilters()}
                                className={'w-full text-xs py-1.5 rounded font-medium transition-colors duration-150'}
                                style={{ backgroundColor: '#1e2d38', color: '#94a3b8', border: '1px solid #2d3338' }}
                            >
                                Apply
                            </button>
                        </div>
                    </div>

                    {/* Event quick-filter chips from current page */}
                    {uniqueEvents.length > 0 && (
                        <div className={'rounded-lg overflow-hidden'} style={card}>
                            <div
                                className={'px-4 py-3'}
                                style={{ backgroundColor: '#0e1417', borderBottom: '1px solid #2d3338' }}
                            >
                                <span className={'text-xs uppercase tracking-wide text-neutral-400'}>
                                    Events on this page
                                </span>
                            </div>
                            <div className={'px-3 py-3 flex flex-col gap-1'}>
                                {uniqueEvents.map((event) => (
                                    <button
                                        key={event}
                                        onClick={() => {
                                            setEventInput(event);
                                            applyFilters(event);
                                        }}
                                        className={'text-left text-xs px-2 py-1.5 rounded truncate transition-colors duration-100'}
                                        style={
                                            activeEvent === event
                                                ? { backgroundColor: '#1e3a5f', color: '#60a5fa' }
                                                : { color: '#64748b' }
                                        }
                                        title={event}
                                    >
                                        {event}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </aside>

                {/* ── Main content ── */}
                <div className={'flex-1 min-w-0'}>
                    {/* Active filter pills (mobile + desktop) */}
                    {hasFilters && (
                        <div className={'flex items-center gap-2 mb-3 flex-wrap'}>
                            {activeEvent && (
                                <span
                                    className={'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full'}
                                    style={{ backgroundColor: '#1e2d38', color: '#94a3b8', border: '1px solid #2d3338' }}
                                >
                                    Event: {activeEvent}
                                    <button onClick={() => { setEventInput(''); applyFilters('', activeIp as string | undefined); }} className={'hover:text-red-400 transition-colors'}>
                                        <XCircleIcon className={'w-3 h-3'} />
                                    </button>
                                </span>
                            )}
                            {activeIp && (
                                <span
                                    className={'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full'}
                                    style={{ backgroundColor: '#1e2d38', color: '#94a3b8', border: '1px solid #2d3338' }}
                                >
                                    IP: {activeIp}
                                    <button onClick={() => { setIpInput(''); applyFilters(activeEvent as string | undefined, ''); }} className={'hover:text-red-400 transition-colors'}>
                                        <XCircleIcon className={'w-3 h-3'} />
                                    </button>
                                </span>
                            )}
                        </div>
                    )}

                    {!data && isValidating ? (
                        <Spinner centered />
                    ) : !data?.items.length ? (
                        <div
                            className={'rounded-lg p-12 flex flex-col items-center justify-center'}
                            style={card}
                        >
                            <p className={'text-sm text-neutral-500'}>No activity logs found{hasFilters ? ' for the current filters' : ''}.</p>
                            {hasFilters && (
                                <button onClick={clearAll} className={'mt-3 text-xs text-neutral-400 hover:text-neutral-200 transition-colors'}>
                                    Clear filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className={'flex flex-col gap-2'}>
                            {data.items.map((activity) => (
                                <ActivityLogEntry key={activity.id} activity={activity}>
                                    <span />
                                </ActivityLogEntry>
                            ))}
                        </div>
                    )}

                    {data && (
                        <div className={'mt-4'}>
                            <PaginationFooter
                                pagination={data.pagination}
                                onPageSelect={(page) => setFilters((v) => ({ ...v, page }))}
                            />
                        </div>
                    )}
                </div>
            </div>
        </ServerContentBlock>
    );
};
