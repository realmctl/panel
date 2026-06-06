import React, { useEffect, useState } from 'react';
import getServerDatabases from '@/api/server/databases/getServerDatabases';
import { ServerContext } from '@/state/server';
import { httpErrorToHuman } from '@/api/http';
import FlashMessageRender from '@/components/FlashMessageRender';
import DatabaseRow from '@/components/server/databases/DatabaseRow';
import Spinner from '@/components/elements/Spinner';
import CreateDatabaseButton from '@/components/server/databases/CreateDatabaseButton';
import Can from '@/components/elements/Can';
import useFlash from '@/plugins/useFlash';
import Fade from '@/components/elements/Fade';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { useDeepMemoize } from '@/plugins/useDeepMemoize';

export default () => {
    const uuid          = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const databaseLimit = ServerContext.useStoreState((state) => state.server.data!.featureLimits.databases);

    const { addError, clearFlashes } = useFlash();
    const [loading, setLoading] = useState(true);

    const databases    = useDeepMemoize(ServerContext.useStoreState((state) => state.databases.data));
    const setDatabases = ServerContext.useStoreActions((state) => state.databases.setDatabases);

    useEffect(() => {
        setLoading(!databases.length);
        clearFlashes('databases');

        getServerDatabases(uuid)
            .then((databases) => setDatabases(databases))
            .catch((error) => {
                console.error(error);
                addError({ key: 'databases', message: httpErrorToHuman(error) });
            })
            .then(() => setLoading(false));
    }, []);

    return (
        <ServerContentBlock title={'Databases'}>
            <FlashMessageRender byKey={'databases'} className={'mb-4'} />

            {!databases.length && loading ? (
                <Spinner size={'large'} centered />
            ) : (
                <Fade timeout={150}>
                    <>
                        {/* Top bar */}
                        {databaseLimit > 0 && databases.length > 0 && (
                            <div className={'flex items-center justify-between mb-6'}>
                                <span className={'text-sm text-neutral-400'}>
                                    <span className={'text-neutral-100 font-semibold'}>{databases.length}</span>
                                    <span className={'text-neutral-600'}> / </span>
                                    {databaseLimit} databases used
                                </span>
                                <Can action={'database.create'}>
                                    {databases.length < databaseLimit && <CreateDatabaseButton />}
                                </Can>
                            </div>
                        )}

                        {databases.length > 0 ? (
                            <div className={'grid grid-cols-1 md:grid-cols-2 gap-3'}>
                                {databases.map((database) => (
                                    <DatabaseRow key={database.id} database={database} />
                                ))}
                            </div>
                        ) : (
                            <div className={'flex flex-col items-center justify-center py-16'}>
                                <h3 className={'text-lg font-semibold text-neutral-100 mb-1'}>
                                    {databaseLimit > 0 ? 'No databases yet' : 'Databases unavailable'}
                                </h3>
                                <p className={'text-sm text-neutral-400 text-center max-w-sm'}>
                                    {databaseLimit > 0
                                        ? 'Databases let your plugins store persistent data like player stats, economy, and ban records.'
                                        : 'Database creation is not enabled for this server.'}
                                </p>
                                {databaseLimit > 0 && (
                                    <Can action={'database.create'}>
                                        <div className={'mt-6'}>
                                            <CreateDatabaseButton />
                                        </div>
                                    </Can>
                                )}
                            </div>
                        )}
                    </>
                </Fade>
            )}
        </ServerContentBlock>
    );
};
