import React from 'react';
import Modal, { RequiredModalProps } from '@/components/elements/Modal';
import tw from 'twin.macro';

export default ({ onDismissed, ...props }: RequiredModalProps) => (
    <Modal onDismissed={onDismissed} {...props}>
        <h2 css={tw`text-xl font-header text-neutral-100 m-0`}>Change Version</h2>
        <p css={tw`text-sm text-neutral-400 mt-4 mb-0`}>Version changer coming soon.</p>
    </Modal>
);
