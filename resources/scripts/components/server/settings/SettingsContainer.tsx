import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { useHistory, useLocation, useParams, useRouteMatch } from 'react-router-dom';
import { ServerContext } from '@/state/server';
import RenameServerBox from '@/components/server/settings/RenameServerBox';
import FlashMessageRender from '@/components/FlashMessageRender';
import Can from '@/components/elements/Can';
import ReinstallServerBox from '@/components/server/settings/ReinstallServerBox';
import StartupSettingsPanel from '@/components/server/settings/StartupSettingsPanel';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import Spinner from '@/components/elements/Spinner';
import isEqual from 'react-fast-compare';
import CopyOnClick from '@/components/elements/CopyOnClick';
import { ip } from '@/lib/formatters';
import RealmCard from '@/components/elements/realm/RealmCard';
import AccessSettingsPanel from '@/components/server/settings/AccessSettingsPanel';
import { realmClasses } from '@/lib/realmTokens';
import { DetailGroup, DetailRow } from '@/components/server/settings/DetailRow';
import { ArchiveIcon, ChipIcon, CogIcon, DatabaseIcon, GlobeAltIcon, SaveIcon } from '@heroicons/react/outline';

const TAB_SWITCH_DELAY_MS = 200;

type Tab = 'general' | 'access' | 'danger' | 'startup' | 'variables';

const TAB_IDS: Tab[] = ['general', 'access', 'danger', 'startup', 'variables'];

const ALL_TABS: { id: Tab; label: string; permission: string | string[] | null }[] = [
    { id: 'general', label: 'General', permission: null },
    { id: 'access', label: 'Access', permission: 'user.*' },
    { id: 'startup', label: 'Startup & Docker', permission: 'startup.*' },
    { id: 'variables', label: 'Variables', permission: 'startup.*' },
    { id: 'danger', label: 'Danger Zone', permission: 'settings.reinstall' },
];

const canAccessTab = (permission: string | string[] | null, userPermissions: string[]): boolean => {
    if (!permission) {
        return true;
    }

    if (userPermissions[0] === '*') {
        return true;
    }

    const actions = Array.isArray(permission) ? permission : [permission];

    return actions.some(
        (action) =>
            (action.endsWith('.*') &&
                userPermissions.some((value) => value.startsWith(action.split('.')[0]))) ||
            userPermissions.indexOf(action) >= 0
    );
};

const tabFromSearch = (search: string): Tab | null => {
    const value = new URLSearchParams(search).get('tab');

    if (value && TAB_IDS.includes(value as Tab)) {
        return value as Tab;
    }

    return null;
};

const tabFromParam = (tab?: string): Tab => {
    if (tab === 'details') {
        return 'general';
    }

    if (tab && TAB_IDS.includes(tab as Tab)) {
        return tab as Tab;
    }

    return 'general';
};

export default () => {
    const history = useHistory();
    const location = useLocation();
    const { tab: tabParam } = useParams<{ tab?: string }>();
    const serverMatch = useRouteMatch<{ id: string }>('/server/:id');
    const userPermissions = ServerContext.useStoreState((state) => state.server.permissions);

    const visibleTabs = useMemo(
        () => ALL_TABS.filter((tab) => canAccessTab(tab.permission, userPermissions)),
        [userPermissions]
    );

    const activeTab = useMemo(() => tabFromParam(tabParam), [tabParam]);

    const settingsPath = useCallback(
        (tab: Tab) => {
            const base = `${serverMatch!.url.replace(/\/?$/, '')}/settings`;
            return tab === 'general' ? base : `${base}/${tab}`;
        },
        [serverMatch]
    );

    const [renderedTab, setRenderedTab] = useState<Tab>(activeTab);
    const [isTabLoading, setIsTabLoading] = useState(false);
    const isInitialMount = useRef(true);

    const switchTab = useCallback(
        (tab: Tab) => {
            if (activeTab === tab) {
                return;
            }

            setIsTabLoading(true);
            history.push(settingsPath(tab));
        },
        [activeTab, history, settingsPath]
    );

    useEffect(() => {
        if (tabParam === 'details') {
            history.replace(settingsPath('general'));
            return;
        }

        const legacyTab = tabFromSearch(location.search);
        if (!legacyTab) {
            return;
        }

        history.replace(settingsPath(legacyTab));
    }, [history, location.search, settingsPath, tabParam]);

    useEffect(() => {
        if (!tabParam) {
            return;
        }

        if (!TAB_IDS.includes(tabParam as Tab)) {
            history.replace(settingsPath('general'));
            return;
        }

        if (!visibleTabs.some((tab) => tab.id === tabParam)) {
            history.replace(settingsPath(visibleTabs[0]?.id ?? 'general'));
        }
    }, [tabParam, visibleTabs, history, settingsPath]);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            setRenderedTab(activeTab);
            return;
        }

        setIsTabLoading(true);

        const timer = window.setTimeout(() => {
            setRenderedTab(activeTab);
            setIsTabLoading(false);
        }, TAB_SWITCH_DELAY_MS);

        return () => window.clearTimeout(timer);
    }, [activeTab]);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const node = ServerContext.useStoreState((state) => state.server.data!.node);
    const dockerImage = ServerContext.useStoreState((state) => state.server.data!.dockerImage);
    const status = ServerContext.useStoreState((state) => state.server.data!.status);
    const nodeLocation = ServerContext.useStoreState((state) => state.server.data!.nodeLocation);
    const allocations = ServerContext.useStoreState((state) => state.server.data!.allocations, isEqual);
    const defaultAllocation = allocations.find((allocation) => allocation.isDefault) ?? allocations[0];
    const limits = ServerContext.useStoreState((state) => state.server.data!.limits, isEqual);
    const featureLimits = ServerContext.useStoreState((state) => state.server.data!.featureLimits, isEqual);

    const showStartupFlash = renderedTab === 'startup' || renderedTab === 'variables';

    return (
        <ServerContentBlock title={'Settings'}>
            <FlashMessageRender byKey={'settings'} className={'mb-4'} />
            {showStartupFlash && <FlashMessageRender byKey={'startup:image'} className={'mb-4'} />}

            <div className={'grid grid-cols-1 lg:grid-cols-[13rem_1fr] gap-6'}>
                <div
                    className={classNames(
                        'flex lg:flex-col gap-1 p-1 rounded-md flex-shrink-0 lg:self-start overflow-x-auto',
                        realmClasses.tabBar
                    )}
                >
                    {visibleTabs.map((tab) => {
                        const active = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                type={'button'}
                                onClick={() => switchTab(tab.id)}
                                className={classNames(
                                    'flex-1 lg:flex-none text-left px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 whitespace-nowrap border-0 cursor-pointer',
                                    active ? realmClasses.tabActive : realmClasses.tabInactive
                                )}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className={'min-w-0 relative min-h-[12rem]'}>
                    {isTabLoading ? (
                        <Spinner centered size={Spinner.Size.LARGE} />
                    ) : (
                        <>
                            {renderedTab === 'general' && (
                                <div className={'space-y-4'}>
                                    <Can action={'settings.rename'}>
                                        <RenameServerBox />
                                    </Can>

                                    <div className={'grid grid-cols-1 md:grid-cols-2 gap-4'}>
                                        <RealmCard
                                            rounded={'md'}
                                            border={'soft'}
                                            header={
                                                <h2 className={'text-base font-semibold text-neutral-100 m-0'}>
                                                    Resources
                                                </h2>
                                            }
                                            headerClassName={'!py-2.5 !bg-realm-card !border-realm-border/50'}
                                            bodyClassName={'space-y-4'}
                                        >
                                            <div className={'space-y-2.5'}>
                                                <DetailGroup label={'Limits'} />
                                                <DetailRow
                                                    icon={ChipIcon}
                                                    label={'Memory'}
                                                    value={limits.memory ? `${limits.memory} MiB` : 'Unlimited'}
                                                />
                                                <DetailRow
                                                    icon={SaveIcon}
                                                    label={'Disk'}
                                                    value={limits.disk ? `${limits.disk} MiB` : 'Unlimited'}
                                                />
                                                <DetailRow
                                                    icon={CogIcon}
                                                    label={'CPU'}
                                                    value={limits.cpu ? `${limits.cpu}%` : 'Unlimited'}
                                                />
                                            </div>

                                            <div className={'border-t border-realm-border/50 pt-3.5 space-y-2.5'}>
                                                <DetailGroup label={'Allowances'} />
                                                <DetailRow
                                                    icon={DatabaseIcon}
                                                    label={'Databases'}
                                                    value={featureLimits.databases}
                                                />
                                                <DetailRow
                                                    icon={ArchiveIcon}
                                                    label={'Backups'}
                                                    value={featureLimits.backups}
                                                />
                                                <DetailRow
                                                    icon={GlobeAltIcon}
                                                    label={'Allocations'}
                                                    value={featureLimits.allocations}
                                                />
                                            </div>
                                        </RealmCard>

                                        <RealmCard
                                            rounded={'md'}
                                            border={'soft'}
                                            header={
                                                <h2 className={'text-base font-semibold text-neutral-100 m-0'}>
                                                    Debug Information
                                                </h2>
                                            }
                                            headerClassName={'!py-2.5 !bg-realm-card !border-realm-border/50'}
                                            bodyClassName={'space-y-3'}
                                        >
                                            <div className={'flex items-center justify-between text-sm'}>
                                                <span className={'text-neutral-400'}>Node</span>
                                                <code
                                                    className={
                                                        'font-mono text-xs px-2 py-1 rounded bg-realm-surface text-realm-code'
                                                    }
                                                >
                                                    {node}
                                                </code>
                                            </div>
                                            <CopyOnClick text={uuid}>
                                                <div className={'flex items-center justify-between text-sm cursor-pointer'}>
                                                    <span className={'text-neutral-400'}>Server ID</span>
                                                    <code
                                                        className={
                                                            'font-mono text-xs px-2 py-1 rounded bg-realm-surface text-realm-code'
                                                        }
                                                    >
                                                        {uuid}
                                                    </code>
                                                </div>
                                            </CopyOnClick>
                                            <div className={'flex items-center justify-between text-sm'}>
                                                <span className={'text-neutral-400'}>Status</span>
                                                <code
                                                    className={
                                                        'font-mono text-xs px-2 py-1 rounded bg-realm-surface text-realm-code'
                                                    }
                                                >
                                                    {status ?? 'unknown'}
                                                </code>
                                            </div>
                                            <div className={'flex items-center justify-between text-sm'}>
                                                <span className={'text-neutral-400'}>Docker Image</span>
                                                <code
                                                    className={
                                                        'font-mono text-xs px-2 py-1 rounded bg-realm-surface text-realm-code truncate max-w-[60%]'
                                                    }
                                                >
                                                    {dockerImage}
                                                </code>
                                            </div>
                                            {defaultAllocation && (
                                                <CopyOnClick text={`${ip(defaultAllocation.ip)}:${defaultAllocation.port}`}>
                                                    <div className={'flex items-center justify-between text-sm cursor-pointer'}>
                                                        <span className={'text-neutral-400'}>Allocation</span>
                                                        <code
                                                            className={
                                                                'font-mono text-xs px-2 py-1 rounded bg-realm-surface text-realm-code'
                                                            }
                                                        >
                                                            {ip(defaultAllocation.ip)}:{defaultAllocation.port}
                                                        </code>
                                                    </div>
                                                </CopyOnClick>
                                            )}
                                            {nodeLocation && (
                                                <div className={'flex items-center justify-between text-sm'}>
                                                    <span className={'text-neutral-400'}>Location</span>
                                                    <code
                                                        className={
                                                            'font-mono text-xs px-2 py-1 rounded bg-realm-surface text-realm-code'
                                                        }
                                                    >
                                                        {nodeLocation.city ?? nodeLocation.region ?? nodeLocation.country ?? '-'}
                                                    </code>
                                                </div>
                                            )}
                                        </RealmCard>
                                    </div>
                                </div>
                            )}

                            {renderedTab === 'danger' && (
                                <div className={'space-y-4'}>
                                    <Can action={'settings.reinstall'}>
                                        <RealmCard
                                            rounded={'md'}
                                            border={'soft'}
                                            header={
                                                <h2 className={'text-base font-semibold text-neutral-100 m-0'}>
                                                    Reinstall Server
                                                </h2>
                                            }
                                            headerClassName={'!py-2.5 !bg-realm-card !border-realm-border/50'}
                                        >
                                            <ReinstallServerBox />
                                        </RealmCard>
                                    </Can>
                                </div>
                            )}

                            {renderedTab === 'access' && (
                                <Can action={'user.*'}>
                                    <AccessSettingsPanel />
                                </Can>
                            )}

                            {renderedTab === 'startup' && <StartupSettingsPanel section={'startup'} />}
                            {renderedTab === 'variables' && <StartupSettingsPanel section={'variables'} />}
                        </>
                    )}
                </div>
            </div>
        </ServerContentBlock>
    );
};
