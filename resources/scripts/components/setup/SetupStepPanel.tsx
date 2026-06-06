import React from 'react';
import styles from '@/components/setup/style.module.css';

interface Props {
    title: string;
    description?: React.ReactNode;
    children: React.ReactNode;
}

export default ({ title, description, children }: Props) => (
    <section className={styles.stepPanel}>
        <header className={styles.stepHeader}>
            <p className={styles.stepEyebrow}>Setup</p>
            <h2 className={styles.stepTitle}>{title}</h2>
            {description && <div className={styles.stepDescription}>{description}</div>}
        </header>
        <div className={styles.stepBody}>{children}</div>
    </section>
);
