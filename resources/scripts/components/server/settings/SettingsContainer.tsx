import React, { useState } from 'react';
import { ServerContext } from '@/state/server';
import { useStoreState } from 'easy-peasy';
import RenameServerBox from '@/components/server/settings/RenameServerBox';
import FlashMessageRender from '@/components/FlashMessageRender';
import Can from '@/components/elements/Can';
import ReinstallServerBox from '@/components/server/settings/ReinstallServerBox';
import Input from '@/components/elements/Input';
import Label from '@/components/elements/Label';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import isEqual from 'react-fast-compare';
import CopyOnClick from '@/components/elements/CopyOnClick';
import { ip } from '@/lib/formatters';
import { Button } from '@/components/elements/button/index';

type Tab = 'general' | 'details' | 'danger';

const TABS: { id: Tab; label: string }[] = [
    { id: 'general', label: 'General'        },
    { id: 'details', label: 'Server Details' },
    { id: 'danger',  label: 'Danger Zone'    },
];

const card = { backgroundColor: '#192024', border: '1px solid #2d3338' } as React.CSSProperties;
const cardHeader = { backgroundColor: '#0e1417', borderBottom: '1px solid #2d3338' } as React.CSSProperties;

export default () => {
    const [activeTab, setActiveTab] = useState<Tab>('general');

    const username = useStoreState((state) => state.user.data!.username);
    const id       = ServerContext.useStoreState((state) => state.server.data!.id);
    const uuid     = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const node     = ServerContext.useStoreState((state) => state.server.data!.node);
    const sftp     = ServerContext.useStoreState((state) => state.server.data!.sftpDetails, isEqual);

    return (
        <ServerContentBlock title={'Settings'}>
            <FlashMessageRender byKey={'settings'} className={'mb-4'} />

            {/* Tab bar */}
            <div
                className={'flex items-center gap-1 p-1 rounded-lg mb-6 w-fit'}
                style={{ backgroundColor: '#0e1417', border: '1px solid #2d3338' }}
            >
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={'px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-150'}
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

            {/* General tab: SFTP + Debug */}
            {activeTab === 'general' && (
                <div className={'grid grid-cols-1 md:grid-cols-2 gap-4'}>
                    <Can action={'file.sftp'}>
                        <div className={'rounded-lg overflow-hidden'} style={card}>
                            <div className={'px-4 py-3'} style={cardHeader}>
                                <span className={'text-xs uppercase tracking-wide text-neutral-400'}>SFTP Details</span>
                            </div>
                            <div className={'px-4 py-4 space-y-4'}>
                                <div>
                                    <Label>Server Address</Label>
                                    <CopyOnClick text={`sftp://${ip(sftp.ip)}:${sftp.port}`}>
                                        <Input type={'text'} value={`sftp://${ip(sftp.ip)}:${sftp.port}`} readOnly />
                                    </CopyOnClick>
                                </div>
                                <div>
                                    <Label>Username</Label>
                                    <CopyOnClick text={`${username}.${id}`}>
                                        <Input type={'text'} value={`${username}.${id}`} readOnly />
                                    </CopyOnClick>
                                </div>
                                <div
                                    className={'flex items-center justify-between gap-4 p-3 rounded-md'}
                                    style={{ backgroundColor: '#0e1417', border: '1px solid #2d3338' }}
                                >
                                    <p className={'text-xs text-neutral-400 flex-1'}>
                                        Your SFTP password is the same as your panel password.
                                    </p>
                                    <a href={`sftp://${username}.${id}@${ip(sftp.ip)}:${sftp.port}`}>
                                        <Button.Text variant={Button.Variants.Secondary} size={Button.Sizes.Small}>
                                            Launch SFTP
                                        </Button.Text>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </Can>

                    <div className={'rounded-lg overflow-hidden'} style={card}>
                        <div className={'px-4 py-3'} style={cardHeader}>
                            <span className={'text-xs uppercase tracking-wide text-neutral-400'}>Debug Information</span>
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

            {/* Details tab: rename */}
            {activeTab === 'details' && (
                <div className={'max-w-xl'}>
                    <Can action={'settings.rename'}>
                        <div className={'rounded-lg overflow-hidden'} style={card}>
                            <div className={'px-4 py-3'} style={cardHeader}>
                                <span className={'text-xs uppercase tracking-wide text-neutral-400'}>Server Details</span>
                            </div>
                            <div className={'px-4 py-4'}>
                                <RenameServerBox />
                            </div>
                        </div>
                    </Can>
                </div>
            )}

            {/* Danger tab: reinstall */}
            {activeTab === 'danger' && (
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
        </ServerContentBlock>
    );
};
