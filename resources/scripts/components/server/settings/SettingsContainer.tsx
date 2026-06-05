import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHistory, useLocation, useParams, useRouteMatch } from 'react-router-dom';
import { ServerContext } from '@/state/server';
import { useStoreState } from 'easy-peasy';
import RenameServerBox from '@/components/server/settings/RenameServerBox';
import FlashMessageRender from '@/components/FlashMessageRender';
import Can from '@/components/elements/Can';
import ReinstallServerBox from '@/components/server/settings/ReinstallServerBox';
import StartupSettingsPanel from '@/components/server/settings/StartupSettingsPanel';
import Input from '@/components/elements/Input';
import Label from '@/components/elements/Label';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import Spinner from '@/components/elements/Spinner';
import isEqual from 'react-fast-compare';
import CopyOnClick from '@/components/elements/CopyOnClick';
import { ip } from '@/lib/formatters';
import { Button } from '@/components/elements/button/index';

const TAB_SWITCH_DELAY_MS = 200;

type Tab = 'general' | 'details' | 'danger' | 'startup' | 'variables';

const TAB_IDS: Tab[] = ['general', 'details', 'danger', 'startup', 'variables'];

const ALL_TABS: { id: Tab; label: string; permission: string | string[] | null }[] = [
    { id: 'general', label: 'General', permission: null },
    { id: 'details', label: 'Server Details', permission: 'settings.rename' },
    { id: 'startup', label: 'Startup & Docker', permission: 'startup.*' },
    { id: 'variables', label: 'Variables', permission: 'startup.*' },
    { id: 'danger', label: 'Danger Zone', permission: 'settings.reinstall' },
];

const card = { backgroundColor: '#192024', border: '1px solid #2d3338' } as React.CSSProperties;
const cardHeader = { backgroundColor: '#0e1417', borderBottom: '1px solid #2d3338' } as React.CSSProperties;

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
        const legacyTab = tabFromSearch(location.search);
        if (!legacyTab) {
            return;
        }

        history.replace(settingsPath(legacyTab));
    }, [history, location.search, settingsPath]);

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

    const username = useStoreState((state) => state.user.data!.username);
    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const node = ServerContext.useStoreState((state) => state.server.data!.node);
    const sftp = ServerContext.useStoreState((state) => state.server.data!.sftpDetails, isEqual);

    const showStartupFlash = renderedTab === 'startup' || renderedTab === 'variables';

    return (
        <ServerContentBlock title={'Settings'}>
            <FlashMessageRender byKey={'settings'} className={'mb-4'} />
            {showStartupFlash && <FlashMessageRender byKey={'startup:image'} className={'mb-4'} />}

            <div
                className={'flex items-center gap-1 p-1 rounded-lg mb-6 w-fit max-w-full overflow-x-auto'}
                style={{ backgroundColor: '#0e1417', border: '1px solid #2d3338' }}
            >
                {visibleTabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => switchTab(tab.id)}
                        className={'px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 whitespace-nowrap'}
                        style={
                            activeTab === tab.id
                                ? { backgroundColor: '#192024', color: '#e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }
                                : { color: '#64748b' }
                        }
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className={'relative min-h-[12rem]'}>
                {isTabLoading ? (
                    <Spinner centered size={Spinner.Size.LARGE} />
                ) : (
                    <>
                        {renderedTab === 'general' && (
                            <div className={'grid grid-cols-1 md:grid-cols-2 gap-4'}>
                                <Can action={'file.sftp'}>
                                    <div className={'rounded-lg overflow-hidden'} style={card}>
                                        <div className={'px-4 py-3'} style={cardHeader}>
                                            <span className={'text-xs uppercase tracking-wide text-neutral-400'}>
                                                SFTP Details
                                            </span>
                                        </div>
                                        <div className={'px-4 py-4 space-y-4'}>
                                            <div>
                                                <Label>Server Address</Label>
                                                <CopyOnClick text={`sftp://${ip(sftp.ip)}:${sftp.port}`}>
                                                    <Input
                                                        type={'text'}
                                                        value={`sftp://${ip(sftp.ip)}:${sftp.port}`}
                                                        readOnly
                                                    />
                                                </CopyOnClick>
                                            </div>
                                            <div>
                                                <Label>Username</Label>
                                                <CopyOnClick text={`${username}.${id}`}>
                                                    <Input type={'text'} value={`${username}.${id}`} readOnly />
                                                </CopyOnClick>
                                            </div>
                                            <div
                                                className={
                                                    'flex items-center justify-between gap-4 p-3 rounded-md'
                                                }
                                                style={{ backgroundColor: '#0e1417', border: '1px solid #2d3338' }}
                                            >
                                                <p className={'text-xs text-neutral-400 flex-1'}>
                                                    Your SFTP password is the same as your panel password.
                                                </p>
                                                <a href={`sftp://${username}.${id}@${ip(sftp.ip)}:${sftp.port}`}>
                                                    <Button.Text
                                                        variant={Button.Variants.Secondary}
                                                        size={Button.Sizes.Small}
                                                    >
                                                        Launch SFTP
                                                    </Button.Text>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </Can>

                                <div className={'rounded-lg overflow-hidden'} style={card}>
                                    <div className={'px-4 py-3'} style={cardHeader}>
                                        <span className={'text-xs uppercase tracking-wide text-neutral-400'}>
                                            Debug Information
                                        </span>
                                    </div>
                                    <div className={'px-4 py-4 space-y-3'}>
                                        <div className={'flex items-center justify-between text-sm'}>
                                            <span className={'text-neutral-400'}>Node</span>
                                            <code
                                                className={'font-mono text-xs px-2 py-1 rounded'}
                                                style={{ backgroundColor: '#0e1417', color: '#94a3b8' }}
                                            >
                                                {node}
                                            </code>
                                        </div>
                                        <CopyOnClick text={uuid}>
                                            <div className={'flex items-center justify-between text-sm cursor-pointer'}>
                                                <span className={'text-neutral-400'}>Server ID</span>
                                                <code
                                                    className={'font-mono text-xs px-2 py-1 rounded'}
                                                    style={{ backgroundColor: '#0e1417', color: '#94a3b8' }}
                                                >
                                                    {uuid}
                                                </code>
                                            </div>
                                        </CopyOnClick>
                                    </div>
                                </div>
                            </div>
                        )}

                        {renderedTab === 'details' && (
                            <div className={'max-w-xl'}>
                                <Can action={'settings.rename'}>
                                    <div className={'rounded-lg overflow-hidden'} style={card}>
                                        <div className={'px-4 py-3'} style={cardHeader}>
                                            <span className={'text-xs uppercase tracking-wide text-neutral-400'}>
                                                Server Details
                                            </span>
                                        </div>
                                        <div className={'px-4 py-4'}>
                                            <RenameServerBox />
                                        </div>
                                    </div>
                                </Can>
                            </div>
                        )}

                        {renderedTab === 'danger' && (
                            <div className={'max-w-xl'}>
                                <Can action={'settings.reinstall'}>
                                    <div className={'rounded-lg overflow-hidden'} style={card}>
                                        <div className={'px-4 py-3'} style={cardHeader}>
                                            <span className={'text-xs uppercase tracking-wide text-neutral-400'}>
                                                Reinstall Server
                                            </span>
                                        </div>
                                        <div className={'px-4 py-4'}>
                                            <ReinstallServerBox />
                                        </div>
                                    </div>
                                </Can>
                            </div>
                        )}

                        {renderedTab === 'startup' && <StartupSettingsPanel section={'startup'} />}
                        {renderedTab === 'variables' && <StartupSettingsPanel section={'variables'} />}
                    </>
                )}
            </div>
        </ServerContentBlock>
    );
};
