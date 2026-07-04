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
                        {databases.length > 0 ? (
                            <div className={'rounded-md border border-realm-border/50 bg-realm-card overflow-hidden'}>
                                <div className={'hidden sm:grid grid-cols-12 gap-4 px-4 py-2 border-b border-realm-border/50'}>
                                    <div className={'col-span-4 text-xs font-medium uppercase tracking-wide text-neutral-500'}>
                                        Name
                                    </div>
                                    <div className={'col-span-3 text-xs font-medium uppercase tracking-wide text-neutral-500'}>
                                        Username
                                    </div>
                                    <div className={'col-span-3 text-xs font-medium uppercase tracking-wide text-neutral-500'}>
                                        Endpoint
                                    </div>
                                    <div className={'col-span-2'} />
                                </div>
                                <div className={'divide-y divide-realm-border/50'}>
                                    {databases.map((database) => (
                                        <DatabaseRow key={database.id} database={database} />
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {databaseLimit > 0 && databases.length > 0 && databases.length < databaseLimit && (
                            <Can action={'database.create'}>
                                <p className={'text-sm text-neutral-500 mt-4 m-0'}>
                                    {databases.length} of {databaseLimit} databases allocated to this server.{' '}
                                    <CreateDatabaseButton
                                        trigger={(open) => (
                                            <button
                                                type={'button'}
                                                onClick={open}
                                                className={
                                                    'bg-transparent border-0 p-0 text-blue-600 hover:text-blue-500 cursor-pointer'
                                                }
                                            >
                                                Create a new database
                                            </button>
                                        )}
                                    />
                                    .
                                </p>
                            </Can>
                        )}

                        {!databases.length && (
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
