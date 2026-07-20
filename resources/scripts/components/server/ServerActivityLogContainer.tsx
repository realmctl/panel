import React, { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import { useActivityLogs } from '@/api/server/activity';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { useFlashKey } from '@/plugins/useFlash';
import FlashMessageRender from '@/components/FlashMessageRender';
import Spinner from '@/components/elements/Spinner';
import ActivityLogEntry from '@/components/elements/activity/ActivityLogEntry';
import PaginationFooter from '@/components/elements/table/PaginationFooter';
import { ActivityLogFilters } from '@/api/account/activity';
import { XCircleIcon, FilterIcon } from '@heroicons/react/solid';
import useLocationHash from '@/plugins/useLocationHash';
import RealmCard from '@/components/elements/realm/RealmCard';
import Input from '@/components/elements/Input';
import Button from '@/components/elements/button/Button';
import { realmClasses } from '@/lib/realmTokens';

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

            <div className={'grid grid-cols-1 lg:grid-cols-[14rem_1fr] gap-4'}>
                {/* ── Sidebar ── */}
                <div className={'hidden lg:flex flex-col gap-4'}>
                    <RealmCard
                        rounded={'md'}
                        border={'soft'}
                        header={
                            <div className={'flex items-center gap-2'}>
                                <FilterIcon className={'w-4 h-4 text-neutral-400'} />
                                <h2 className={'text-base font-semibold text-neutral-100 m-0'}>Filters</h2>
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
                        }
                        headerClassName={'!py-2.5 !bg-realm-card !border-realm-border/50'}
                        bodyClassName={'space-y-4'}
                    >
                        <div>
                            <label className={'block text-xs uppercase tracking-wide text-neutral-500 mb-1.5'}>
                                Event
                            </label>
                            <Input
                                className={'!text-xs !py-1.5'}
                                placeholder={'e.g. server:power'}
                                value={eventInput}
                                onChange={(e) => setEventInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters(eventInput)}
                            />
                        </div>

                        <div>
                            <label className={'block text-xs uppercase tracking-wide text-neutral-500 mb-1.5'}>
                                IP Address
                            </label>
                            <Input
                                className={'!text-xs !py-1.5'}
                                placeholder={'e.g. 192.168.1.1'}
                                value={ipInput}
                                onChange={(e) => setIpInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters(undefined, ipInput)}
                            />
                        </div>

                        <Button
                            size={Button.Sizes.Small}
                            className={'w-full'}
                            onClick={() => applyFilters()}
                        >
                            Apply
                        </Button>
                    </RealmCard>

                    {uniqueEvents.length > 0 && (
                        <RealmCard
                            rounded={'md'}
                            border={'soft'}
                            header={
                                <h2 className={'text-base font-semibold text-neutral-100 m-0'}>
                                    Events on this page
                                </h2>
                            }
                            headerClassName={'!py-2.5 !bg-realm-card !border-realm-border/50'}
                            bodyClassName={'flex flex-col gap-1'}
                        >
                            {uniqueEvents.map((event) => (
                                <button
                                    key={event}
                                    onClick={() => {
                                        setEventInput(event);
                                        applyFilters(event);
                                    }}
                                    className={classNames(
                                        'text-left text-xs px-2 py-1.5 rounded truncate transition-colors duration-100 border',
                                        activeEvent === event
                                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                                            : `${realmClasses.tabInactive} border-transparent hover:text-neutral-200`
                                    )}
                                    title={event}
                                >
                                    {event}
                                </button>
                            ))}
                        </RealmCard>
                    )}
                </div>

                {/* ── Main content ── */}
                <div className={'min-w-0'}>
                    {hasFilters && (
                        <div className={'flex items-center gap-2 mb-4 flex-wrap'}>
                            {activeEvent && (
                                <span
                                    className={
                                        'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ' +
                                        'bg-realm-surface-raised text-realm-code border border-realm-border'
                                    }
                                >
                                    Event: {activeEvent}
                                    <button onClick={() => { setEventInput(''); applyFilters('', activeIp as string | undefined); }} className={'hover:text-red-400 transition-colors'}>
                                        <XCircleIcon className={'w-3 h-3'} />
                                    </button>
                                </span>
                            )}
                            {activeIp && (
                                <span
                                    className={
                                        'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ' +
                                        'bg-realm-surface-raised text-realm-code border border-realm-border'
                                    }
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
                        <Spinner centered size={Spinner.Size.LARGE} />
                    ) : !data?.items.length ? (
                        <RealmCard
                            rounded={'md'}
                            border={'soft'}
                            bodyClassName={'p-8 flex flex-col items-center justify-center'}
                        >
                            <p className={'text-sm text-neutral-500'}>No activity logs found{hasFilters ? ' for the current filters' : ''}.</p>
                            {hasFilters && (
                                <button onClick={clearAll} className={'mt-3 text-xs text-neutral-400 hover:text-neutral-200 transition-colors'}>
                                    Clear filters
                                </button>
                            )}
                        </RealmCard>
                    ) : (
                        <div className={'flex flex-col gap-3'}>
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
