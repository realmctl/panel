import React from 'react';
import tw from 'twin.macro';
import Label from '@/components/elements/Label';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import { InformationCircleIcon } from '@heroicons/react/outline';
import styles from './style.module.css';

interface Props {
    label: string;
    description?: string;
    htmlFor?: string;
}

export default ({ label, description, htmlFor }: Props) => (
    <div className={styles.fieldLabelRow}>
        <Label htmlFor={htmlFor} css={tw`mb-0`}>
            {label}
        </Label>
        {description && (
            <Tooltip content={description} placement={'top'} delay={{ open: 100, close: 80 }}>
                <button
                    type={'button'}
                    className={styles.fieldInfoButton}
                    aria-label={`More information about ${label}`}
                >
                    <InformationCircleIcon className={styles.fieldInfoIcon} />
                </button>
            </Tooltip>
        )}
    </div>
);
