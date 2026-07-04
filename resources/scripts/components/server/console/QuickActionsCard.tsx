import React, { useState } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';
import classNames from 'classnames';
import { PencilIcon } from '@heroicons/react/outline';
import { ServerContext } from '@/state/server';
import RealmCard from '@/components/elements/realm/RealmCard';
import Modal from '@/components/elements/Modal';
import Button from '@/components/elements/Button';
import ChangeVersionModal from '@/components/server/versions/ChangeVersionModal';
import { usePersistedState } from '@/plugins/usePersistedState';
import { QUICK_ACTIONS, DEFAULT_QUICK_ACTION_IDS, getQuickAction, QuickAction } from '@/lib/quickActions';

export default ({ className }: { className?: string }) => {
    const { url } = useRouteMatch();
    const history = useHistory();
    const server = ServerContext.useStoreState((state) => state.server.data!);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);

    const [selected, setSelected] = usePersistedState<string[]>(
        `${server.uuid}:quick_actions`,
        DEFAULT_QUICK_ACTION_IDS
    );
    const [managing, setManaging] = useState(false);
    const [versionModalVisible, setVersionModalVisible] = useState(false);

    const activeIds = selected ?? DEFAULT_QUICK_ACTION_IDS;
    const activeActions = activeIds.map(getQuickAction).filter(Boolean) as QuickAction[];

    const toggleAction = (id: string) => {
        setSelected((current) => {
            const list = current ?? DEFAULT_QUICK_ACTION_IDS;
            return list.includes(id) ? list.filter((entry) => entry !== id) : [...list, id];
        });
    };

    const runAction = (action: QuickAction) => {
        if (action.type === 'link') {
            history.push(`${url}${action.to ?? ''}`);
            return;
        }

        if (action.type === 'version') {
            setVersionModalVisible(true);
            return;
        }

        if (action.type === 'power' && instance && action.power) {
            instance.send('set state', action.power);
        }
    };

    return (
        <>
            <ChangeVersionModal visible={versionModalVisible} onDismissed={() => setVersionModalVisible(false)} />

            <Modal visible={managing} onDismissed={() => setManaging(false)} dismissable closeOnBackground>
                <h2 className={'text-xl font-semibold text-neutral-100 m-0 mb-1'}>Quick Actions</h2>
                <p className={'text-sm text-neutral-400 mb-5'}>Choose which shortcuts show up on the overview page.</p>

                <div className={'grid grid-cols-2 gap-2'}>
                    {QUICK_ACTIONS.map((action) => {
                        const checked = activeIds.includes(action.id);
                        const Icon = action.icon;

                        return (
                            <label
                                key={action.id}
                                className={classNames(
                                    'flex items-center gap-2.5 px-3 py-2.5 rounded-md border cursor-pointer transition-colors duration-150',
                                    checked
                                        ? 'border-blue-500/50 bg-blue-500/5'
                                        : 'border-realm-border/60 hover:border-realm-border'
                                )}
                            >
                                <Icon className={'w-4 h-4 text-neutral-400 flex-shrink-0'} />
                                <span className={'text-sm text-neutral-200 flex-1'}>{action.label}</span>
                                <input
                                    type={'checkbox'}
                                    checked={checked}
                                    onChange={() => toggleAction(action.id)}
                                    className={'w-4 h-4 flex-shrink-0 accent-blue-500 rounded'}
                                />
                            </label>
                        );
                    })}
                </div>

                <div className={'mt-6 pt-4 border-t border-realm-border flex justify-end'}>
                    <Button onClick={() => setManaging(false)}>Done</Button>
                </div>
            </Modal>

            <RealmCard
                rounded={'md'}
                border={'soft'}
                header={
                    <div className={'flex items-center justify-between gap-3'}>
                        <h2 className={'text-base font-semibold text-neutral-100 m-0'}>Quick Actions</h2>
                        <button
                            type={'button'}
                            onClick={() => setManaging(true)}
                            className={'flex items-center gap-1 bg-transparent border-0 p-0 text-xs font-medium text-blue-600 hover:text-blue-500 cursor-pointer'}
                        >
                            <PencilIcon className={'w-3.5 h-3.5'} />
                            Manage
                        </button>
                    </div>
                }
                headerClassName={'!py-2.5 !bg-realm-card !border-realm-border/50'}
                className={className}
            >
                {activeActions.length === 0 ? (
                    <p className={'text-sm text-neutral-400 m-0'}>
                        No quick actions pinned yet. Click Manage to add some.
                    </p>
                ) : (
                    <div className={'flex flex-wrap gap-2'}>
                        {activeActions.map((action) => {
                            const Icon = action.icon;

                            return (
                                <button
                                    key={action.id}
                                    type={'button'}
                                    title={action.label}
                                    onClick={() => runAction(action)}
                                    className={
                                        'flex items-center justify-center w-10 h-10 rounded-md bg-realm-surface border border-realm-border/50 text-neutral-400 hover:text-neutral-100 hover:border-neutral-500 transition-colors duration-150 cursor-pointer'
                                    }
                                >
                                    <Icon className={'w-5 h-5'} />
                                </button>
                            );
                        })}
                    </div>
                )}
            </RealmCard>
        </>
    );
};
