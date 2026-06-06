import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import FileTreeIcon from '@/components/server/files/FileTreeIcon';
import styles from './style.module.css';

interface Props {
    type: 'file' | 'folder';
    depth: number;
    onSubmit: (name: string) => void;
    onCancel: () => void;
}

export default ({ type, depth, onSubmit, onCancel }: Props) => {
    const [value, setValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSubmit = () => {
        const name = value.trim();

        if (!name || name.includes('/') || name.includes('\\')) {
            return;
        }

        onSubmit(name);
    };

    const iconName = value.trim() || (type === 'file' ? 'file.txt' : 'newfolder');

    return (
        <div className={styles.tree_row_wrap} style={{ paddingLeft: `${depth * 12 + 8}px` }}>
            <div className={classNames(styles.tree_row, styles.tree_row_active)}>
                <span className={styles.tree_chevron}>
                    <span className={'inline-block w-2.5'} />
                </span>
                <FileTreeIcon name={iconName} isFile={type === 'file'} />
                <input
                    ref={inputRef}
                    type={'text'}
                    className={styles.tree_inline_input}
                    value={value}
                    placeholder={type === 'file' ? 'filename.txt' : 'folder-name'}
                    spellCheck={false}
                    onChange={(event) => setValue(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            handleSubmit();
                            return;
                        }

                        if (event.key === 'Escape') {
                            event.preventDefault();
                            onCancel();
                        }
                    }}
                />
            </div>
        </div>
    );
};
