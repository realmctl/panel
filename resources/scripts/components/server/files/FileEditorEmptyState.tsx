import React from 'react';
import styles from './style.module.css';

export default () => (
    <div className={styles.editor_empty}>
        <div className={styles.editor_empty_center}>
            <p className={styles.editor_empty_title}>Open a file to start editing</p>
            <p className={styles.editor_empty_subtitle}>Select a file from the explorer on the left</p>
        </div>
    </div>
);
