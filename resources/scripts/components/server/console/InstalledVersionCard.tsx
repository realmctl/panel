import React, { useState } from 'react';
import { ServerContext } from '@/state/server';
import RealmCard from '@/components/elements/realm/RealmCard';
import { getServerSoftware } from '@/lib/serverSoftware';
import { serverHasEggFeature } from '@/lib/eggCategories';
import ChangeVersionModal from '@/components/server/versions/ChangeVersionModal';

export default ({ className }: { className?: string }) => {
    const server = ServerContext.useStoreState((state) => state.server.data!);
    const [modalVisible, setModalVisible] = useState(false);

    if (!serverHasEggFeature(server.eggCategory, 'versions')) {
        return null;
    }

    const software = getServerSoftware(server.installedSoftware);
    const hasVersion = !!server.installedSoftware && !!server.installedVersion;

    return (
        <>
        <ChangeVersionModal visible={modalVisible} onDismissed={() => setModalVisible(false)} />
        <RealmCard
            rounded={'md'}
            border={'soft'}
            header={
                <div className={'flex items-center justify-between gap-3'}>
                    <h2 className={'text-base font-semibold text-neutral-100 m-0'}>Installed Version</h2>
                    <button
                        type={'button'}
                        onClick={() => setModalVisible(true)}
                        className={'bg-transparent border-0 p-0 text-xs font-medium text-blue-600 hover:text-blue-500 cursor-pointer'}
                    >
                        Change
                    </button>
                </div>
            }
            headerClassName={'!py-2.5 !bg-realm-card !border-realm-border/50'}
            className={className}
        >
            {hasVersion ? (
                <div className={'flex items-center gap-3 px-1 py-1'}>
                    <img
                        src={software?.icon ?? '/assets/icons/Grass_Block.png'}
                        alt={software?.name ?? server.installedSoftware ?? 'Server software'}
                        className={'w-12 h-12 rounded-md object-cover flex-shrink-0 border border-realm-border/50 bg-realm-card'}
                    />
                    <div className={'min-w-0 flex-1'}>
                        <p className={'text-sm font-semibold text-neutral-100 truncate m-0'}>
                            {software?.name ?? server.installedSoftware}
                        </p>
                        <span className={'text-xs text-neutral-400'}>
                            {server.installedVersion}
                            {server.installedBuild ? ` ${server.installedBuild}` : ''}
                        </span>
                    </div>
                </div>
            ) : (
                <div className={'px-1 py-1'}>
                    <p className={'text-sm text-neutral-400 m-0'}>
                        No version installed through this panel yet.{' '}
                        <button
                            type={'button'}
                            onClick={() => setModalVisible(true)}
                            className={'bg-transparent border-0 p-0 text-blue-600 hover:text-blue-500 cursor-pointer'}
                        >
                            Install one
                        </button>
                        .
                    </p>
                </div>
            )}
        </RealmCard>
        </>
    );
};
