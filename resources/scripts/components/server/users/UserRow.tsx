import React, { useState } from 'react';
import { useStoreState } from 'easy-peasy';
import { LockClosedIcon, LockOpenIcon, PencilIcon, UserIcon } from '@heroicons/react/outline';
import { Subuser } from '@/state/server/subusers';
import RemoveSubuserButton from '@/components/server/users/RemoveSubuserButton';
import EditSubuserModal from '@/components/server/users/EditSubuserModal';
import Can from '@/components/elements/Can';

interface Props {
    subuser: Subuser;
}

export default ({ subuser }: Props) => {
    const uuid = useStoreState((state) => state.user!.data!.uuid);
    const [visible, setVisible] = useState(false);

    const permissionCount = subuser.permissions.filter((permission) => permission !== 'websocket.connect').length;

    return (
        <div className={'flex items-center gap-3 py-2 text-sm'}>
            <EditSubuserModal subuser={subuser} visible={visible} onModalDismissed={() => setVisible(false)} />

            <UserIcon className={'w-4 h-4 text-neutral-500 flex-shrink-0'} />

            <span className={'text-neutral-200 w-36 flex-shrink-0 truncate'}>{subuser.username}</span>
            <span className={'text-neutral-400 flex-1 min-w-0 truncate'}>{subuser.email}</span>

            {subuser.twoFactorEnabled ? (
                <LockClosedIcon className={'w-4 h-4 text-emerald-400 flex-shrink-0'} />
            ) : (
                <LockOpenIcon className={'w-4 h-4 text-amber-400 flex-shrink-0'} />
            )}

            <span className={'hidden md:inline text-xs text-neutral-500 flex-shrink-0 w-24 text-right'}>
                {permissionCount} permission{permissionCount === 1 ? '' : 's'}
            </span>

            {subuser.uuid !== uuid ? (
                <div className={'flex items-center gap-0.5 flex-shrink-0'}>
                    <Can action={'user.update'}>
                        <button
                            type={'button'}
                            aria-label={'Edit subuser'}
                            className={
                                'p-1 rounded text-neutral-500 hover:text-neutral-100 transition-colors duration-150'
                            }
                            onClick={() => setVisible(true)}
                        >
                            <PencilIcon className={'w-4 h-4'} />
                        </button>
                    </Can>
                    <Can action={'user.delete'}>
                        <RemoveSubuserButton subuser={subuser} />
                    </Can>
                </div>
            ) : (
                <div className={'w-[3.25rem] flex-shrink-0'} />
            )}
        </div>
    );
};
