import React, { useState } from 'react';
import classNames from 'classnames';
import { UserAddIcon } from '@heroicons/react/outline';
import InviteSubuserDrawer from '@/components/server/users/InviteSubuserDrawer';

interface Props {
    size?: 'sm' | 'base';
}

export default ({ size = 'base' }: Props) => {
    const [visible, setVisible] = useState(false);

    return (
        <>
            <InviteSubuserDrawer visible={visible} onDismissed={() => setVisible(false)} />
            <button
                type={'button'}
                onClick={() => setVisible(true)}
                className={classNames(
                    'flex items-center gap-1.5 bg-transparent border-0 p-0 font-medium text-blue-600 hover:text-blue-500 cursor-pointer',
                    size === 'sm' ? 'text-xs gap-1' : 'text-sm'
                )}
            >
                <UserAddIcon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                Invite user
            </button>
        </>
    );
};
