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
import tw from 'twin.macro';
import Fade from '@/components/elements/Fade';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { useDeepMemoize } from '@/plugins/useDeepMemoize';

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const databaseLimit = ServerContext.useStoreState((state) => state.server.data!.featureLimits.databases);

    const { addError, clearFlashes } = useFlash();
    const [loading, setLoading] = useState(true);

    const databases = useDeepMemoize(ServerContext.useStoreState((state) => state.databases.data));
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
            <FlashMessageRender byKey={'databases'} css={tw`mb-4`} />
            {!databases.length && loading ? (
                <Spinner size={'large'} centered />
            ) : (
                <Fade timeout={150}>
                    <>
                        {databases.length > 0 ? (
                            <div className={'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}>
                                {databases.map((database) => (
                                    <DatabaseRow
                                        key={database.id}
                                        database={database}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className={'flex flex-col items-center justify-center py-16'}>
                                <h3 className={'text-lg font-semibold text-neutral-100 mb-1'}>
                                    {databaseLimit > 0 ? 'No databases yet' : 'Databases unavailable'}
                                </h3>
                                <p className={'text-sm text-neutral-400 text-center max-w-sm'}>
                                    {databaseLimit > 0
                                        ? 'Create a database to store your server data. You can manage connections and credentials here.'
                                        : 'Database creation is not enabled for this server. Contact an administrator if you need database access.'}
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
                        <Can action={'database.create'}>
                            {databases.length > 0 && (
                                <div css={tw`mt-6 flex items-center justify-end`}>
                                    <p css={tw`text-sm text-neutral-300 mb-4 sm:mr-6 sm:mb-0`}>
                                        {databases.length} of {databaseLimit} databases have been allocated to this
                                        server.
                                    </p>
                                    {databaseLimit > 0 && databaseLimit !== databases.length && (
                                        <CreateDatabaseButton css={tw`flex justify-end mt-6`} />
                                    )}
                                </div>
                            )}
                        </Can>
                    </>
                </Fade>
            )}
        </ServerContentBlock>
    );
};
