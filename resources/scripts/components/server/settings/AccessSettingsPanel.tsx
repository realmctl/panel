import React, { useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import { Actions, useStoreActions, useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import Spinner from '@/components/elements/Spinner';
import AddSubuserButton from '@/components/server/users/AddSubuserButton';
import UserRow from '@/components/server/users/UserRow';
import FlashMessageRender from '@/components/FlashMessageRender';
import getServerSubusers from '@/api/server/users/getServerSubusers';
import { httpErrorToHuman } from '@/api/http';
import Can from '@/components/elements/Can';
import RealmCard from '@/components/elements/realm/RealmCard';

export default () => {
    const [loading, setLoading] = useState(true);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const subusers = ServerContext.useStoreState((state) => state.subusers.data);
    const setSubusers = ServerContext.useStoreActions((actions) => actions.subusers.setSubusers);

    const permissions = useStoreState((state: ApplicationStore) => state.permissions.data);
    const getPermissions = useStoreActions((actions: Actions<ApplicationStore>) => actions.permissions.getPermissions);
    const { addError, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    useEffect(() => {
        clearFlashes('users');
        getServerSubusers(uuid)
            .then((subusers) => {
                setSubusers(subusers);
                setLoading(false);
            })
            .catch((error) => {
                console.error(error);
                addError({ key: 'users', message: httpErrorToHuman(error) });
            });
    }, []);

    useEffect(() => {
        if (!Object.keys(permissions).length) {
            getPermissions().catch((error) => {
                addError({ key: 'users', message: httpErrorToHuman(error) });
                console.error(error);
            });
        }
    }, []);

    return (
        <div className={'max-w-3xl'}>
            <RealmCard
                header={
                    <div className={'flex items-center justify-between gap-3'}>
                        <span className={'text-xs uppercase tracking-wide text-neutral-400'}>Server Access</span>
                        <Can action={'user.create'}>
                            <AddSubuserButton />
                        </Can>
                    </div>
                }
                bodyClassName={'space-y-2'}
            >
                <FlashMessageRender byKey={'users'} className={'mb-2'} />

                {!subusers.length && (loading || !Object.keys(permissions).length) ? (
                    <Spinner size={'large'} centered />
                ) : !subusers.length ? (
                    <div className={'flex flex-col items-center justify-center py-10'}>
                        <h3 className={'text-base font-semibold text-neutral-100 mb-1'}>No invited users yet</h3>
                        <p className={'text-sm text-neutral-400 text-center max-w-sm'}>
                            Invite people to give them access to this server with specific permissions.
                        </p>
                        <Can action={'user.create'}>
                            <div className={'mt-6'}>
                                <AddSubuserButton />
                            </div>
                        </Can>
                    </div>
                ) : (
                    subusers.map((subuser) => <UserRow key={subuser.uuid} subuser={subuser} />)
                )}
            </RealmCard>
        </div>
    );
};
