import React, { useState } from 'react';
import { RefreshIcon } from '@heroicons/react/outline';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import Can from '@/components/elements/Can';
import ChangeVersionModal from '@/components/server/versions/ChangeVersionModal';
import { ServerContext } from '@/state/server';
import { serverHasEggFeature } from '@/lib/eggCategories';

const VersionButton = styled.button`
    ${tw`inline-flex items-center gap-2 py-3 text-sm font-medium text-neutral-300 border-0 bg-transparent cursor-pointer whitespace-nowrap transition-colors duration-150`};
    font: inherit;

    &:hover {
        ${tw`text-neutral-100`};
    }
`;

export default () => {
    const [visible, setVisible] = useState(false);
    const eggCategory = ServerContext.useStoreState((state) => state.server.data?.eggCategory ?? null);

    if (!serverHasEggFeature(eggCategory, 'versions')) {
        return null;
    }

    return (
        <Can action={'startup.*'}>
            <VersionButton type={'button'} onClick={() => setVisible(true)}>
                <RefreshIcon className={'w-4 h-4 text-blue-500 flex-shrink-0'} />
                <span>Change Version</span>
            </VersionButton>
            <ChangeVersionModal visible={visible} onDismissed={() => setVisible(false)} />
        </Can>
    );
};
