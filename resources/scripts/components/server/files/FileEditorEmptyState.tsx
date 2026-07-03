import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import styles from './style.module.css';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);

export default () => (
    <div className={styles.editor_empty}>
        <div className={styles.editor_empty_center}>
            <div className={styles.editor_empty_icon}>
                <FontAwesomeIcon icon={faFolderOpen} className={'text-lg'} />
            </div>
            <p className={styles.editor_empty_title}>No file open</p>
            <p className={styles.editor_empty_subtitle}>Select a file in the explorer to view or edit it.</p>
            <div className={styles.editor_empty_hints}>
                <div className={styles.editor_empty_hint}>
                    <span>Save file</span>
                    <span>
                        <kbd className={styles.editor_empty_kbd}>{isMac ? '⌘' : 'Ctrl'}</kbd>{' '}
                        <kbd className={styles.editor_empty_kbd}>S</kbd>
                    </span>
                </div>
                <div className={styles.editor_empty_hint}>
                    <span>Multi-select files</span>
                    <span>
                        <kbd className={styles.editor_empty_kbd}>{isMac ? '⌘' : 'Ctrl'}</kbd>{' '}
                        <kbd className={styles.editor_empty_kbd}>Click</kbd>
                    </span>
                </div>
                <div className={styles.editor_empty_hint}>
                    <span>Rename, move, delete</span>
                    <span>
                        <kbd className={styles.editor_empty_kbd}>Right click</kbd>
                    </span>
                </div>
            </div>
        </div>
    </div>
);
