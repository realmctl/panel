import React from 'react';
import styles from '@/components/setup/style.module.css';

interface Props {
    id: string;
    label: string;
    help?: string;
    error?: string;
    children: React.ReactNode;
}

export default ({ id, label, help, error, children }: Props) => (
    <div className={styles.field}>
        <label htmlFor={id} className={styles.fieldLabel}>
            {label}
        </label>
        {children}
        {help && <p className={styles.fieldHelp}>{help}</p>}
        {error && <p className={styles.fieldError}>{error}</p>}
    </div>
);

export const inputClassName = styles.fieldInput;
export const selectClassName = styles.fieldSelect;
export const textareaClassName = styles.fieldTextarea;
