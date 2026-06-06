import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import FileTreeIcon from '@/components/server/files/FileTreeIcon';
import styles from './style.module.css';

interface Props {
    initialName: string;
    isFile: boolean;
    depth: number;
    onSubmit: (name: string) => void;
    onCancel: () => void;
}

export default ({ initialName, isFile, depth, onSubmit, onCancel }: Props) => {
    const [value, setValue] = useState(initialName);
    const inputRef = useRef<HTMLInputElement>(null);
    const submittedRef = useRef(false);

    useEffect(() => {
        const input = inputRef.current;

        if (!input) {
            return;
        }

        input.focus();
        input.select();
    }, []);

    const handleSubmit = () => {
        const name = value.trim();

        if (!name || name.includes('/') || name.includes('\\')) {
            return;
        }

        submittedRef.current = true;

        if (name === initialName) {
            onCancel();
            return;
        }

        onSubmit(name);
    };

    const iconName = value.trim() || initialName;

    return (
        <div className={styles.tree_row_wrap} style={{ paddingLeft: `${depth * 12 + 8}px` }}>
            <div className={classNames(styles.tree_row, styles.tree_row_active)}>
                <span className={styles.tree_chevron}>
                    <span className={'inline-block w-2.5'} />
                </span>
                <FileTreeIcon name={iconName} isFile={isFile} />
                <input
                    ref={inputRef}
                    type={'text'}
                    className={styles.tree_inline_input}
                    value={value}
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
                    onBlur={() => {
                        if (!submittedRef.current) {
                            onCancel();
                        }
                    }}
                />
            </div>
        </div>
    );
};
