import React, { useState } from 'react';
import { KeyIcon } from '@heroicons/react/outline';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisH } from '@fortawesome/free-solid-svg-icons';
import { useStoreState } from 'easy-peasy';
import { ServerContext } from '@/state/server';
import { ip } from '@/lib/formatters';
import { Button } from '@/components/elements/button/index';
import { Dialog } from '@/components/elements/dialog';
import Label from '@/components/elements/Label';
import Input from '@/components/elements/Input';
import CopyOnClick from '@/components/elements/CopyOnClick';
import DropdownMenu from '@/components/elements/DropdownMenu';
import styled from 'styled-components/macro';
import tw from 'twin.macro';

const StyledRow = styled.div`
    ${tw`p-2 flex items-center rounded hover:bg-neutral-100 hover:text-neutral-700`};
`;

export default () => {
    const [visible, setVisible] = useState(false);

    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const username = useStoreState((state) => state.user.data!.username);
    const sftp = ServerContext.useStoreState((state) => state.server.data!.sftpDetails);

    return (
        <>
            <Dialog open={visible} onClose={() => setVisible(false)} title={'SFTP Details'}>
                <div>
                    <Label>Address</Label>
                    <CopyOnClick text={`sftp://${ip(sftp.ip)}:${sftp.port}`}>
                        <Input type={'text'} readOnly value={`${ip(sftp.ip)}:${sftp.port}`} />
                    </CopyOnClick>
                </div>
                <div className={'mt-5'}>
                    <Label>Username</Label>
                    <CopyOnClick text={`${username}.${id}`}>
                        <Input type={'text'} readOnly value={`${username}.${id}`} />
                    </CopyOnClick>
                </div>
                <Dialog.Footer>
                    <Button.Text onClick={() => setVisible(false)}>Close</Button.Text>
                    <a
                        href={`sftp://${username}.${id}@${ip(sftp.ip)}:${sftp.port}`}
                        className={'inline-flex'}
                    >
                        <Button>Launch SFTP</Button>
                    </a>
                </Dialog.Footer>
            </Dialog>
            <DropdownMenu
                renderToggle={(onClick) => (
                    <div
                        className={
                            'flex items-center justify-center w-8 h-8 rounded-md text-neutral-400 hover:text-neutral-100 hover:bg-neutral-700/50 cursor-pointer transition-colors duration-150'
                        }
                        onClick={onClick}
                    >
                        <FontAwesomeIcon icon={faEllipsisH} size={'sm'} />
                    </div>
                )}
            >
                <StyledRow onClick={() => setVisible(true)}>
                    <KeyIcon className={'w-3.5 h-3.5'} />
                    <span css={tw`ml-2`}>SFTP Details</span>
                </StyledRow>
            </DropdownMenu>
        </>
    );
};
