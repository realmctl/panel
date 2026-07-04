import React, { useState } from 'react';
import { UserAddIcon } from '@heroicons/react/outline';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import Can from '@/components/elements/Can';
import InviteSubuserDrawer from '@/components/server/users/InviteSubuserDrawer';

const InviteButton = styled.button`
    ${tw`inline-flex items-center gap-2 py-3 text-sm font-medium text-neutral-300 border-0 bg-transparent cursor-pointer whitespace-nowrap transition-colors duration-150`};
    font: inherit;

    &:hover {
        ${tw`text-neutral-100`};
    }
`;

export default () => {
    const [visible, setVisible] = useState(false);

    return (
        <Can action={'user.create'}>
            <InviteButton type={'button'} onClick={() => setVisible(true)}>
                <UserAddIcon className={'w-4 h-4 text-blue-500 flex-shrink-0'} />
                <span>Invite People</span>
            </InviteButton>
            <InviteSubuserDrawer visible={visible} onDismissed={() => setVisible(false)} />
        </Can>
    );
};
