import React from 'react';
import Tooltip from '@/components/elements/tooltip/Tooltip';

interface Props {
    label: string;
    children: React.ReactElement;
}

export default ({ label, children }: Props) => (
    <Tooltip content={label} placement={'right'} delay={{ open: 0, close: 80 }}>
        {children}
    </Tooltip>
);
